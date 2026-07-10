"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { completeSpotifyAuth } from "@/lib/spotify";

export default function SpotifyCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    completeSpotifyAuth()
      .then((returnTo) => {
        if (!cancelled) window.location.replace(returnTo);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ground px-6 text-center">
      {error ? (
        <>
          <p className="text-sm font-medium text-ink">Couldn&apos;t connect to Spotify</p>
          <p className="max-w-sm text-sm text-ink-2">{error}</p>
          <Link
            href="/"
            className="mt-2 rounded-full bg-cta px-4 py-2 text-sm font-semibold text-cta-ink transition hover:opacity-90"
          >
            Back to the map
          </Link>
        </>
      ) : (
        <>
          <span
            className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent"
            aria-hidden
          />
          <p className="text-sm text-ink-2">Connecting to Spotify…</p>
        </>
      )}
    </main>
  );
}
