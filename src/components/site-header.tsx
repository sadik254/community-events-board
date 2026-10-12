"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      setLoading(true);
      setError(null);
      setUser(null);

      try {
        const response = await fetch("/api/auth/me", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (response.status === 401) {
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to check your login status.");
        }

        const result: { user: User } = await response.json();

        if (!controller.signal.aborted) {
          setUser(result.user);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Unable to check your login status.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => controller.abort();
  }, [pathname, retryCount]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to log out. Please try again.");
      }

      setUser(null);
      router.replace("/events");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to log out. Please try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/events"
            className="text-lg font-bold text-teal-800"
          >
            Community Events Board
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-4 text-sm"
          >
            <Link
              href="/events"
              aria-current={pathname === "/events" ? "page" : undefined}
              className="font-medium text-slate-600 hover:text-teal-700"
            >
              Events
            </Link>

            {loading ? (
              <span role="status" className="text-slate-500">
                Checking login…
              </span>
            ) : user ? (
              <>
                <span
                  title={user.email}
                  className="max-w-48 truncate text-slate-500"
                >
                  {user.email}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loggingOut ? "Logging out…" : "Log out"}
                </button>
              </>
            ) : !error ? (
              <>
                <Link
                  href="/login"
                  className="font-medium text-teal-700 hover:underline"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
                >
                  Sign up
                </Link>
              </>
            ) : null}
          </nav>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-700"
          >
            <p>{error}</p>

            {!user && (
              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className="font-semibold underline"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}