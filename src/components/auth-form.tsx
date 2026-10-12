"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : "Unable to continue. Please try again.",
        );
      }

      router.replace(isSignup ? "/login" : "/events");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );

      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-60";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <Link
          href="/events"
          className="mb-8 block text-center text-lg font-bold text-teal-800"
        >
          Community Events Board
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isSignup
              ? "Sign up to personalize your local events experience."
              : "Log in to explore events picked for you."}
          </p>

          <form
            onSubmit={handleSubmit}
            aria-busy={loading}
            className="mt-6 space-y-5"
          >
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
                disabled={loading}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  isSignup ? "new-password" : "current-password"
                }
                required
                minLength={isSignup ? 8 : 1}
                aria-describedby={isSignup ? "password-help" : undefined}
                disabled={loading}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />

              {isSignup && (
                <p
                  id="password-help"
                  className="mt-2 text-xs leading-5 text-slate-500"
                >
                  Use at least 8 characters. Maximum 72 bytes;
                  some characters, such as emoji, use multiple bytes.
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isSignup
                  ? "Creating account…"
                  : "Logging in…"
                : isSignup
                  ? "Create account"
                  : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isSignup
              ? "Already have an account? "
              : "New to the community? "}

            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-teal-700 hover:underline"
            >
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </section>

        <Link
          href="/events"
          className="mt-6 block text-center text-sm text-slate-600 hover:text-teal-700"
        >
          Continue browsing events
        </Link>
      </div>
    </main>
  );
}