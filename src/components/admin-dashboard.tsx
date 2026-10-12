"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Category = "MUSIC" | "WORKSHOP" | "FOOD" | "SPORTS" | "KIDS";

type EventItem = {
  id: string;
  title: string;
  category: Category;
  city: string;
  startsAt: string;
  pricePaise: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

type EventForm = {
  title: string;
  category: Category;
  city: string;
  startsAt: string;
  price: string;
  description: string;
  imageUrl: string;
};

const emptyForm: EventForm = {
  title: "",
  category: "MUSIC",
  city: "",
  startsAt: "",
  price: "0",
  description: "",
  imageUrl: "",
};

const categories: { value: Category; label: string }[] = [
  { value: "MUSIC", label: "Music" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "FOOD", label: "Food" },
  { value: "SPORTS", label: "Sports" },
  { value: "KIDS", label: "Kids" },
];

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

function formatPrice(pricePaise: number) {
  if (pricePaise === 0) return "Free";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(pricePaise / 100);
}

export function AdminDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadEvents(signal?: AbortSignal) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/events", {
        cache: "no-store",
        signal,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not load events.");
      }

      if (!signal?.aborted) {
        setEvents(result.events);
      }
    } catch (error) {
      if (signal?.aborted) return;

      setError(
        error instanceof Error ? error.message : "Could not load events.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadEvents(controller.signal);

    return () => controller.abort();
  }, []);

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const priceNumber = Number(form.price);

    if (
      !Number.isFinite(priceNumber) ||
      priceNumber < 0 ||
      Math.round(priceNumber * 100) !== priceNumber * 100
    ) {
      setError("Enter a valid price with no more than two decimal places.");
      return;
    }

    const startsAt = new Date(form.startsAt);

    if (Number.isNaN(startsAt.getTime())) {
      setError("Choose a valid event date and time.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          city: form.city,
          startsAt: startsAt.toISOString(),
          pricePaise: Math.round(priceNumber * 100),
          description: form.description,
          imageUrl: form.imageUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not create event.");
      }

      setForm(emptyForm);
      setNotice("Event created and set to active.");
      await loadEvents();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not create event.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(event: EventItem) {
    setBusyEventId(event.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/events/${encodeURIComponent(event.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !event.isActive }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not update event.");
      }

      setEvents((current) =>
        current.map((item) =>
          item.id === event.id ? result.event : item,
        ),
      );
      setNotice(
        result.event.isActive
          ? "Event is now active."
          : "Event is now inactive.",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update event.",
      );
    } finally {
      setBusyEventId(null);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600";

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/events" className="font-medium text-teal-700 hover:underline">
          ← View public events
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Admin · Manage events</h1>
        <p className="mt-2 text-slate-600">
          Add events and change whether they appear to visitors.
        </p>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="mt-6 rounded-xl bg-green-50 p-4 text-green-800">
            {notice}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Add an event</h2>

          <form
            onSubmit={createEvent}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="text-sm font-medium">
              Title
              <input
                className={inputClass}
                required
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>

            <label className="text-sm font-medium">
              Category
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Category })
                }
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              City
              <input
                className={inputClass}
                required
                maxLength={100}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>

            <label className="text-sm font-medium">
              Date and time
              <input
                className={inputClass}
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </label>

            <label className="text-sm font-medium">
              Price in rupees
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>

            <label className="text-sm font-medium sm:col-span-2">
              Image URL
              <input
                className={inputClass}
                type="url"
                required
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </label>

            <label className="text-sm font-medium sm:col-span-2">
              Description
              <textarea
                className={inputClass}
                required
                maxLength={5000}
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {saving ? "Creating event…" : "Create active event"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">All events</h2>

          {loading ? (
            <p role="status" className="py-10 text-slate-600">
              Loading events…
            </p>
          ) : events.length === 0 ? (
            <p className="mt-4 rounded-xl bg-white p-6 text-slate-600">
              No events have been added yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          event.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {event.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {event.category} · {event.city} ·{" "}
                      {dateFormatter.format(new Date(event.startsAt))} ·{" "}
                      {formatPrice(event.pricePaise)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleActive(event)}
                    disabled={busyEventId === event.id}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    {busyEventId === event.id
                      ? "Saving…"
                      : event.isActive
                        ? "Make inactive"
                        : "Make active"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}