"use client";

import { useEffect, useState } from "react";

type ReminderButtonProps = {
  eventId: string;
};

export function ReminderButton({ eventId }: ReminderButtonProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReminder() {
      try {
        const response = await fetch(
          `/api/events/${encodeURIComponent(eventId)}/reminder`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (controller.signal.aborted) return;

        if (response.status === 401) {
          setError("Log in to save reminders.");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load reminder status.");
        }

        const result: { enabled: boolean } = await response.json();

        if (!controller.signal.aborted) {
          setEnabled(result.enabled);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Could not load reminder status.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReminder();

    return () => controller.abort();
  }, [eventId]);

  async function toggleReminder() {
    if (saving || loading) return;

    const previousValue = enabled;
    const nextValue = !previousValue;

    setEnabled(nextValue);
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(eventId)}/reminder`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled: nextValue }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : "Could not save reminder.",
        );
      }

      setEnabled(result.enabled);
    } catch (error) {
      setEnabled(previousValue);
      setError(
        error instanceof Error
          ? error.message
          : "Could not save reminder.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={toggleReminder}
        disabled={loading || saving}
        aria-pressed={enabled}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
          enabled
            ? "bg-teal-100 text-teal-900 hover:bg-teal-200"
            : "bg-teal-700 text-white hover:bg-teal-800"
        }`}
      >
        {loading
          ? "Checking…"
          : saving
            ? "Saving…"
            : enabled
              ? "Reminder set ✓"
              : "Remind me"}
      </button>

      {error && (
        <p role="status" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}