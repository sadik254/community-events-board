"use client";

import Link from "next/link";
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

type FeedResponse = {
  events: EventItem[];
  message?: string;
};

const categoryLabels: Record<string, string> = {
  MUSIC: "Music",
  WORKSHOP: "Workshop",
  FOOD: "Food",
  SPORTS: "Sports",
  KIDS: "Kids",
};

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

export default function FeedPage() {
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeed() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/feed", {
          signal: controller.signal,
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (response.status === 401) {
          throw new Error("Log in to see your personalized feed.");
        }

        if (!response.ok) {
          throw new Error(
            typeof result?.error === "string"
              ? result.error
              : "Unable to load your feed. Please try again.",
          );
        }

        if (!controller.signal.aborted) {
          setData(result as FeedResponse);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadFeed();

    return () => controller.abort();
  }, [retryCount]);

  const buttonClass =
    "rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800";

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
          Picked for you
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          My Feed
        </h1>

        <p className="mt-3 text-slate-600">
          Upcoming events from your favourite categories.
        </p>

        {loading ? (
          <p role="status" className="py-16 text-center text-slate-600">
            Finding events for you…
          </p>
        ) : error ? (
          <section
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
          >
            <p className="text-red-800">{error}</p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {error.includes("Log in") && (
                <Link href="/login" className={buttonClass}>
                  Log in
                </Link>
              )}

              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className={buttonClass}
              >
                Try again
              </button>
            </div>
          </section>
        ) : data && data.events.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-12">
            <p aria-hidden="true" className="text-4xl">
              ✨
            </p>

            <h2 className="mt-4 text-xl font-semibold">
              Your feed is ready to be personalized
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-slate-600">
              {data.message ??
                "There aren’t any upcoming events in your selected categories yet."}
            </p>

            <Link
              href="/preferences"
              className={`${buttonClass} mt-6 inline-block`}
            >
              Choose favourite categories
            </Link>
          </section>
        ) : data ? (
          <section aria-label="Events in your feed" className="mt-8">
            <p className="mb-4 text-sm text-slate-600">
              {data.events.length} upcoming{" "}
              {data.events.length === 1 ? "event" : "events"}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.events.map((event) => (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
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
                      {categoryLabels[event.category] ?? event.category}
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
                    <ReminderButton eventId={event.id} />
                  </div>
                </article>
              ))}
            </div>

            <Link
              href="/preferences"
              className="mt-8 inline-block font-medium text-teal-700 hover:underline"
            >
              Change my favourite categories
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}