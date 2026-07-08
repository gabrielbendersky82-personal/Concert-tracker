"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "magic";
type Status = "idle" | "working" | "sent" | "error";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function LoginPage() {
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

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
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

      <p className="mt-5 text-center text-sm text-slate-500">
        Just looking around?{" "}
        <Link
          href="/demo"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          Explore the live demo →
        </Link>
      </p>
    </main>
  );
}
