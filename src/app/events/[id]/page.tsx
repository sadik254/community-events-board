"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ReminderButton } from "@/components/reminder-button";

type EventItem = {
  id: string;
  title: string;
  category: string;
  city: string;
  startsAt: string;
  pricePaise: number;
  description: string;
  imageUrl: string;
};

type Theme = "SUNSET" | "OCEAN" | "FOREST";
type Sticker = "🎵" | "⭐" | "🎈" | "🍕" | "⚽";

const themes: { value: Theme; label: string; className: string }[] = [
  {
    value: "SUNSET",
    label: "Sunset",
    className: "bg-gradient-to-br from-orange-200 via-rose-200 to-fuchsia-300",
  },
  {
    value: "OCEAN",
    label: "Ocean",
    className: "bg-gradient-to-br from-cyan-200 via-sky-300 to-blue-400",
  },
  {
    value: "FOREST",
    label: "Forest",
    className: "bg-gradient-to-br from-lime-200 via-emerald-300 to-teal-500",
  },
];

const stickers: Sticker[] = ["🎵", "⭐", "🎈", "🍕", "⚽"];

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [theme, setTheme] = useState<Theme>("SUNSET");
  const [selectedStickers, setSelectedStickers] = useState<Sticker[]>([]);
  const [designLoading, setDesignLoading] = useState(true);
  const [designSaving, setDesignSaving] = useState(false);
  const [designError, setDesignError] = useState("");
  const [designNotice, setDesignNotice] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvent() {
      try {
        const response = await fetch(
          `/api/events/${encodeURIComponent(eventId)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Could not load this event.");
        }

        if (!controller.signal.aborted) {
          setEvent(result.event);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Could not load this event.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setPageLoading(false);
        }
      }
    }

    void loadEvent();

    return () => controller.abort();
  }, [eventId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDesign() {
      try {
        const response = await fetch(
          `/api/events/${encodeURIComponent(eventId)}/design`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (response.status === 401) {
          setNeedsLogin(true);
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load your saved design.");
        }

        const result: {
          theme: Theme;
          stickers: unknown;
        } = await response.json();

        if (!controller.signal.aborted) {
          setTheme(result.theme);

          if (
            Array.isArray(result.stickers) &&
            result.stickers.every((item) => stickers.includes(item))
          ) {
            setSelectedStickers(result.stickers as Sticker[]);
          }

          setNeedsLogin(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setDesignError(
            error instanceof Error
              ? error.message
              : "Could not load your saved design.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setDesignLoading(false);
        }
      }
    }

    void loadDesign();

    return () => controller.abort();
  }, [eventId]);

  function toggleSticker(sticker: Sticker) {
    setDesignNotice("");
    setDesignError("");

    setSelectedStickers((current) => {
      if (current.includes(sticker)) {
        return current.filter((item) => item !== sticker);
      }

      if (current.length >= 3) {
        setDesignError("You can add up to three stickers.");
        return current;
      }

      return [...current, sticker];
    });
  }

  async function saveDesign() {
    if (needsLogin) return;

    setDesignSaving(true);
    setDesignError("");
    setDesignNotice("");

    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(eventId)}/design`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme,
            stickers: selectedStickers,
          }),
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        setNeedsLogin(true);
        throw new Error("Log in to save your card design.");
      }

      if (!response.ok) {
        throw new Error(result.error ?? "Could not save your design.");
      }

      setTheme(result.theme);
      setSelectedStickers(result.stickers);
      setDesignNotice("Your card design has been saved.");
    } catch (error) {
      setDesignError(
        error instanceof Error
          ? error.message
          : "Could not save your design.",
      );
    } finally {
      setDesignSaving(false);
    }
  }

  const selectedTheme =
    themes.find((item) => item.value === theme) ?? themes[0];

  if (pageLoading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12">
        <p role="status">Loading event…</p>
      </main>
    );
  }

  if (pageError || !event) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12">
        <p role="alert" className="text-red-700">
          {pageError || "Event not found."}
        </p>
        <Link href="/events" className="mt-4 inline-block text-teal-700">
          Back to events
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/events" className="font-medium text-teal-700 hover:underline">
          ← Back to events
        </Link>

        <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.imageUrl}
            alt=""
            className="h-64 w-full bg-slate-200 object-cover sm:h-80"
          />

          <div className="p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              {event.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold">{event.title}</h1>

            <p className="mt-3 text-slate-600">
              {event.city} · {dateFormatter.format(new Date(event.startsAt))}
            </p>

            <p className="mt-5 leading-7 text-slate-700">
              {event.description}
            </p>

            <p className="mt-5 text-lg font-semibold text-teal-800">
              {event.pricePaise === 0
                ? "Free"
                : priceFormatter.format(event.pricePaise / 100)}
            </p>

            <ReminderButton eventId={event.id} />
          </div>
        </article>

        <section className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Make it yours
          </p>

          <h2 className="mt-2 text-2xl font-bold">Design your card</h2>

          <p className="mt-2 text-slate-600">
            Pick a theme and up to three stickers. Your choices update the
            preview right away.
          </p>

          {designLoading ? (
            <p role="status" className="mt-6 text-slate-600">
              Loading your saved design…
            </p>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold">Choose a background</h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {themes.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={theme === option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setDesignNotice("");
                      }}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                        theme === option.value
                          ? "border-teal-700 bg-teal-50 text-teal-900"
                          : "border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <h3 className="mt-6 font-semibold">Add stickers</h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {stickers.map((sticker) => {
                    const selected = selectedStickers.includes(sticker);

                    return (
                      <button
                        key={sticker}
                        type="button"
                        aria-label={
                          selected
                            ? `Remove ${sticker} sticker`
                            : `Add ${sticker} sticker`
                        }
                        aria-pressed={selected}
                        onClick={() => toggleSticker(sticker)}
                        className={`rounded-xl border px-4 py-2 text-2xl transition-transform duration-200 hover:scale-105 ${
                          selected
                            ? "border-teal-700 bg-teal-50"
                            : "border-slate-300"
                        }`}
                      >
                        {sticker}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  {selectedStickers.length} of 3 stickers selected. Tap a
                  selected sticker to remove it.
                </p>

                {needsLogin && (
                  <p className="mt-4 text-sm text-amber-800">
                    Log in to load and save your design.{" "}
                    <Link href="/login" className="font-semibold underline">
                      Log in
                    </Link>
                  </p>
                )}

                {designError && (
                  <p role="alert" className="mt-4 text-sm text-red-700">
                    {designError}
                  </p>
                )}

                {designNotice && (
                  <p role="status" className="mt-4 text-sm text-green-700">
                    {designNotice}
                  </p>
                )}

                <button
                  type="button"
                  onClick={saveDesign}
                  disabled={designSaving || needsLogin}
                  className="mt-5 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {designSaving ? "Saving…" : "Save card design"}
                </button>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">Live preview</h3>

                <div
                  className={`${selectedTheme.className} min-h-64 rounded-2xl p-6 shadow-sm transition-all duration-300`}
                >
                  <div className="flex min-h-52 flex-col justify-between rounded-xl border border-white/60 bg-white/30 p-5 backdrop-blur-sm transition-all duration-300">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                        {event.city}
                      </p>
                      <h4 className="mt-2 text-2xl font-bold text-slate-950">
                        {event.title}
                      </h4>
                      <p className="mt-2 text-sm text-slate-800">
                        {dateFormatter.format(new Date(event.startsAt))}
                      </p>
                    </div>

                    <div className="mt-5 flex min-h-10 flex-wrap gap-2">
                      {selectedStickers.map((sticker, index) => (
                        <span
                          key={`${sticker}-${index}`}
                          className="animate-in rounded-full bg-white/70 px-3 py-1 text-2xl shadow-sm transition-all duration-300"
                        >
                          {sticker}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}