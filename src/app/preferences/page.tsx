"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const categories = [
  {
    value: "MUSIC",
    label: "Music",
    emoji: "🎵",
    description: "Live music and performances",
  },
  {
    value: "WORKSHOP",
    label: "Workshop",
    emoji: "🛠️",
    description: "Learn a skill or make something",
  },
  {
    value: "FOOD",
    label: "Food",
    emoji: "🍲",
    description: "Food fairs and local flavours",
  },
  {
    value: "SPORTS",
    label: "Sports",
    emoji: "⚽",
    description: "Games, fitness, and outdoor activities",
  },
  {
    value: "KIDS",
    label: "Kids",
    emoji: "🧸",
    description: "Activities for children and families",
  },
] as const;

type Category = (typeof categories)[number]["value"];

export default function PreferencesPage() {
  const [selected, setSelected] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreferences() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/favourites", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (response.status === 401) {
          throw new Error("Please log in to choose your categories.");
        }

        if (!response.ok) {
          throw new Error("Unable to load your preferences. Try again.");
        }

        const result: { categories: Category[] } =
          await response.json();

        if (!controller.signal.aborted) {
          setSelected(result.categories);
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

    void loadPreferences();

    return () => controller.abort();
  }, []);

  function toggleCategory(category: Category) {
    setNotice(null);

    setSelected((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  async function savePreferences() {
    if (saving || loading) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/favourites", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: selected }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : "Unable to save your preferences. Try again.",
        );
      }

      setSelected(result.categories);
      setNotice("Your preferences have been saved.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save your preferences.",
      );
    } finally {
      setSaving(false);
    }
  }

  const buttonClass =
    "rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/events"
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          ← Browse all events
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Make it yours
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            What are you interested in?
          </h1>
          <p className="mt-3 text-slate-600">
            Pick the categories you enjoy. Your My Feed will show upcoming
            events that match.
          </p>
        </div>

        <section
          aria-busy={loading || saving}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
        >
          {loading ? (
            <p role="status" className="py-8 text-center text-slate-600">
              Loading your preferences…
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((category) => {
                  const checked = selected.includes(category.value);

                  return (
                    <label
                      key={category.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                        checked
                          ? "border-teal-600 bg-teal-50"
                          : "border-slate-200 hover:border-teal-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(category.value)}
                        className="mt-1 size-4 accent-teal-700"
                      />

                      <span aria-hidden="true" className="text-2xl">
                        {category.emoji}
                      </span>

                      <span>
                        <span className="block font-semibold">
                          {category.label}
                        </span>
                        <span className="mt-1 block text-sm text-slate-600">
                          {category.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className="mt-4 text-sm text-slate-500">
                {selected.length} of {categories.length} selected
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {error}
                </p>
              )}

              {notice && (
                <p
                  role="status"
                  className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                  {notice}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={savePreferences}
                  disabled={saving}
                  className={buttonClass}
                >
                  {saving ? "Saving…" : "Save preferences"}
                </button>

                <Link
                  href="/feed"
                  className="rounded-xl px-4 py-3 font-medium text-teal-800 hover:bg-teal-50"
                >
                  View My Feed
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}