"use client";

import { useEffect, useState } from "react";

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

type EventsResponse = {
  events: EventItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

type Filters = {
  category: string;
  city: string;
  q: string;
};

const initialFilters: Filters = {
  category: "",
  city: "",
  q: "",
};

const categories = ["MUSIC", "WORKSHOP", "FOOD", "SPORTS", "KIDS"];
const cities = ["Coimbatore", "Chennai", "Bengaluru"];

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function categoryLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function EventsPage() {
  const [draftFilters, setDraftFilters] =
    useState<Filters>(initialFilters);

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: "6",
      });

      if (filters.category) params.set("category", filters.category);
      if (filters.city) params.set("city", filters.city);
      if (filters.q) params.set("q", filters.q);

      try {
        const response = await fetch(`/api/events?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load events. Please try again.");
        }

        const result: EventsResponse = await response.json();

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadEvents();

    return () => controller.abort();
  }, [filters, page, retryCount]);

  const fieldClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600";

  const buttonClass =
    "rounded-xl bg-teal-700 px-5 py-2.5 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5">
          <p className="text-lg font-bold text-teal-800">
            Community Events Board
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-teal-700">
            Explore your community
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find your next local experience
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Discover music, workshops, food, sports, and family activities
            near you.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setFilters({
              ...draftFilters,
              q: draftFilters.q.trim(),
            });
          }}
          className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="space-y-2">
            <span className="text-sm font-medium">Search events</span>
            <input
              type="search"
              placeholder="Try music night"
              value={draftFilters.q}
              onChange={(event) =>
                setDraftFilters({
                  ...draftFilters,
                  q: event.target.value,
                })
              }
              className={fieldClass}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <select
              value={draftFilters.category}
              onChange={(event) =>
                setDraftFilters({
                  ...draftFilters,
                  category: event.target.value,
                })
              }
              className={fieldClass}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">City</span>
            <select
              value={draftFilters.city}
              onChange={(event) =>
                setDraftFilters({
                  ...draftFilters,
                  city: event.target.value,
                })
              }
              className={fieldClass}
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button type="submit" className={buttonClass}>
              Apply filters
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftFilters(initialFilters);
                setFilters(initialFilters);
                setPage(1);
              }}
              className="rounded-xl px-3 py-2.5 font-medium text-slate-600 hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </form>

        <section aria-label="Events" aria-busy={loading}>
          {loading ? (
            <p role="status" className="py-16 text-center text-slate-600">
              Loading community events…
            </p>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
            >
              <p className="mb-4 text-red-800">{error}</p>
              <button
                onClick={() => setRetryCount((count) => count + 1)}
                className={buttonClass}
              >
                Try again
              </button>
            </div>
          ) : data && data.events.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <h2 className="text-xl font-semibold">No events found</h2>
              <p className="mt-2 text-slate-600">
                Try another city, category, or search term.
              </p>
            </div>
          ) : data ? (
            <>
              <p className="mb-4 text-sm text-slate-600">
                {data.pagination.total} matching events
              </p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.events.map((event) => (
                  <article
                    key={event.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-44 w-full bg-slate-200 object-cover"
                    />

                    <div className="p-5">
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                        {categoryLabel(event.category)}
                      </span>

                      <h2 className="mt-4 text-xl font-semibold">
                        {event.title}
                      </h2>

                      <p className="mt-2 text-sm text-slate-600">
                        {event.city}
                      </p>

                      <time
                        dateTime={event.startsAt}
                        className="mt-1 block text-sm text-slate-600"
                      >
                        {dateFormatter.format(new Date(event.startsAt))}
                      </time>

                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                        {event.description}
                      </p>

                      <p className="mt-5 font-semibold text-teal-800">
                        {event.pricePaise === 0
                          ? "Free"
                          : priceFormatter.format(event.pricePaise / 100)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <nav
                aria-label="Event pagination"
                className="mt-8 flex items-center justify-center gap-4"
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className={buttonClass}
                >
                  Previous
                </button>

                <span className="text-sm text-slate-600">
                  Page {page} of {data.pagination.totalPages}
                </span>

                <button
                  disabled={!data.pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className={buttonClass}
                >
                  Next
                </button>
              </nav>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}