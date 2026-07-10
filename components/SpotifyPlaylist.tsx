"use client";

import { useState } from "react";
import type { Show } from "@/lib/types";

const GREEN = "#1db954";

/** open.spotify.com search deep link — opens the Spotify app (or web), no auth. */
export function spotifySearchUrl(query: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

function SpotifyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.586 14.424a.622.622 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 1 1-.277-1.215c3.809-.871 7.077-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.723a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 1 1-.452-1.492c3.632-1.102 8.147-.568 11.232 1.329a.78.78 0 0 1 .257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 1 1-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.936.936 0 1 1-.955 1.608z" />
    </svg>
  );
}

/**
 * "Listen on Spotify" — deep-links into Spotify with no login and no Web API,
 * so it works for everyone (including the demo) and can never be rate-limited
 * or blocked. Opens the artist, copies the setlist for a manual playlist, and
 * every setlist song is individually tappable (rendered in ShowDetail).
 */
export default function SpotifyPlaylist({ show }: { show: Show }) {
  const [copied, setCopied] = useState(false);
  if (show.setlist_songs.length === 0) return null;

  const songs = [...show.setlist_songs].sort((a, b) => a.position - b.position);

  async function copySetlist() {
    const header = [show.artist, show.venue, show.city, show.show_date.slice(0, 4)]
      .filter(Boolean)
      .join(" · ");
    const body = songs.map((s, i) => `${i + 1}. ${s.title}`).join("\n");
    try {
      await navigator.clipboard.writeText(`${header}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={spotifySearchUrl(show.artist)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          style={{ background: GREEN }}
        >
          <SpotifyLogo className="h-4 w-4" />
          Open on Spotify
        </a>
        <button
          type="button"
          onClick={copySetlist}
          className="rounded-full border border-line-2 px-4 py-2 text-sm font-medium text-ink-2 transition hover:bg-raised"
        >
          {copied ? "Copied ✓" : "Copy setlist"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-3">
        Opens the artist in Spotify. Copy the setlist to paste into a new
        playlist, or tap any song above to play it.
      </p>
    </div>
  );
}
