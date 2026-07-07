"use client";

import { useState } from "react";
import { createProfile } from "@/lib/profiles";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function WelcomeForm({ email }: { email: string }) {
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createProfile(handle, name);
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 text-3xl" aria-hidden>
            👋
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Pick your handle
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            This is how friends will find you on Concert Map.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="handle" className="mb-1 block text-sm font-medium text-slate-700">
              Handle
            </label>
            <div className="flex items-center rounded-lg border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
              <span className="pl-3 text-slate-400">@</span>
              <input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="gabriel"
                autoComplete="off"
                required
                className="w-full rounded-lg bg-transparent px-1 py-2 text-slate-900 outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              3–20 characters: lowercase letters, numbers, or underscores.
            </p>
          </div>

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Display name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gabriel B."
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Continue"}
          </button>
          <p className="text-center text-xs text-slate-400">Signed in as {email}</p>
        </form>
      </div>
    </main>
  );
}
