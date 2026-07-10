"use client";

import { useEffect, useState } from "react";
import {
  beginSpotifyAuth,
  createSetlistPlaylist,
  isSpotifyConfigured,
  isSpotifyConnected,
  type PlaylistResult,
} from "@/lib/spotify";
import type { Show } from "@/lib/types";

const GREEN = "#1db954";

function SpotifyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.586 14.424a.622.622 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 1 1-.277-1.215c3.809-.871 7.077-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.723a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 1 1-.452-1.492c3.632-1.102 8.147-.568 11.232 1.329a.78.78 0 0 1 .257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 1 1-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.936.936 0 1 1-.955 1.608z" />
    </svg>
  );
}

type State = "idle" | "building" | "done" | "error";

export default function SpotifyPlaylist({ show }: { show: Show }) {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<PlaylistResult | null>(null);
  const [error, setError] = useState("");

  // localStorage read must run client-side after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConnected(isSpotifyConnected());
  }, []);

  // Hidden entirely unless a Client ID is configured and there's a setlist.
  if (!isSpotifyConfigured() || show.setlist_songs.length === 0) return null;

  async function build() {
    setState("building");
    setProgress({ done: 0, total: show.setlist_songs.length });
    try {
      const r = await createSetlistPlaylist(show, (done, total) =>
        setProgress({ done, total })
      );
      setResult(r);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setState("error");
    }
  }

  function handleClick() {
    if (!connected) {
      // Return to this exact view with the show reopened after consent.
      const url = new URL(window.location.href);
      url.searchParams.set("show", show.id);
      beginSpotifyAuth(url.pathname + url.search + url.hash);
      return;
    }
    build();
  }

  if (state === "done" && result) {
    return (
      <div className="mt-4 rounded-lg border border-line bg-raised p-3">
        <div className="flex items-center gap-2">
          <SpotifyLogo className="h-4 w-4" />
          <p className="text-sm font-semibold text-ink">Playlist created</p>
        </div>
        <p className="mt-1 text-xs text-ink-2">
          Added {result.found} of {result.total} songs
          {result.missed.length > 0 && " — a few weren't on Spotify"}.
        </p>
        {result.missed.length > 0 && (
          <details className="mt-1.5">
            <summary className="cursor-pointer text-xs text-ink-3">
              Show {result.missed.length} not found
            </summary>
            <ul className="mt-1 space-y-0.5 pl-3 text-xs text-ink-3">
              {result.missed.map((t) => (
                <li key={t} className="list-disc">
                  {t}
                </li>
              ))}
            </ul>
          </details>
        )}
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-black transition hover:opacity-90"
          style={{ background: GREEN }}
        >
          <SpotifyLogo className="h-4 w-4" />
          Open in Spotify
        </a>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "building"}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-70"
        style={{ background: GREEN }}
      >
        <SpotifyLogo className="h-4 w-4" />
        {state === "building"
          ? `Building… ${progress.done}/${progress.total}`
          : "Relive on Spotify"}
      </button>
      {!connected && (
        <p className="mt-1.5 text-xs text-ink-3">
          Turn this setlist into a Spotify playlist. You&apos;ll connect your
          account once.
        </p>
      )}
      {state === "error" && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
