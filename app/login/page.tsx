"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "magic";
type Status = "idle" | "working" | "sent" | "error";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function LoginPage() {
  const [view, setView] = useState<"choose" | "auth">("choose");
  const [mode, setMode] = useState<Mode>("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("working");
    setMessage("");

    try {
      const supabase = createClient();
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign("/");
          return;
        }
        // No session → the project still requires email confirmation.
        setStatus("sent");
        setMessage(
          "Account created. Check your email to confirm, then sign in — or turn off email confirmation in Supabase to skip this."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        window.location.assign("/");
      }
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    }
  }

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("working");
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setStatus("idle");
    setMessage("");
  }

  const magicSent = mode === "magic" && status === "sent";

  if (view === "choose") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-2 text-4xl" aria-hidden>
              📍🎶
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Concert Map
            </h1>
            <p className="mt-1.5 text-slate-500">
              Every concert you&apos;ve ever seen, on one map.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/demo"
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/70 to-white p-8 text-center shadow-sm ring-1 ring-indigo-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                No account
              </span>
              <DemoArt />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Explore the live demo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jump straight into a sample map, timeline &amp; stats.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                Open demo
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setView("auth")}
              className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <SignInArt />
              <h2 className="mt-4 text-lg font-bold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">
                Log in to build and keep your own concert map.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                Continue
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <button
          type="button"
          onClick={() => setView("choose")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <span aria-hidden>←</span> Back
        </button>
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl" aria-hidden>
            📍🎶
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Concert Map
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to map every show you&apos;ve seen.
          </p>
        </div>

        {magicSent ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-center text-sm text-emerald-800">
            Check <span className="font-medium">{email}</span> for a magic link
            to sign in.
          </div>
        ) : mode === "password" ? (
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={status === "working"}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
            >
              {status === "working"
                ? "Please wait…"
                : isSignUp
                ? "Create account"
                : "Sign in"}
            </button>

            {status === "error" && (
              <p className="text-sm text-red-600" role="alert">
                {message}
              </p>
            )}
            {status === "sent" && (
              <p className="text-sm text-emerald-700">{message}</p>
            )}

            <div className="flex items-center justify-between pt-1 text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp((v) => !v);
                  setStatus("idle");
                  setMessage("");
                }}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                {isSignUp ? "Have an account? Sign in" : "Create an account"}
              </button>
              <button
                type="button"
                onClick={() => switchMode("magic")}
                className="text-slate-500 hover:text-slate-700"
              >
                Email me a link
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMagic} className="space-y-4">
            <div>
              <label
                htmlFor="magic-email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="magic-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={status === "working"}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
            >
              {status === "working" ? "Sending…" : "Send magic link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600" role="alert">
                {message}
              </p>
            )}
            <div className="pt-1 text-center text-sm">
              <button
                type="button"
                onClick={() => switchMode("password")}
                className="text-slate-500 hover:text-slate-700"
              >
                Use a password instead
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function DemoArt() {
  return (
    <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 shadow-md">
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 21s-6-5.4-6-10a6 6 0 1112 0c0 4.6-6 10-6 10z" />
        <circle cx="12" cy="11" r="2.4" />
      </svg>
      <span className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white text-pink-600 shadow ring-1 ring-slate-100">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

function SignInArt() {
  return (
    <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-slate-700 to-indigo-700 shadow-md">
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="8.5" r="3.6" />
        <path d="M5 20a7 7 0 0114 0" />
      </svg>
    </span>
  );
}
