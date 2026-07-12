import { DEMO_SHOWS } from "./demoShows";
import type { Show } from "./types";

// ── Live demo data ───────────────────────────────────────────────────────────
// The demo's "You" persona mirrors the owner's real account instead of a
// frozen snapshot: server-side we read their shows anonymously (their profile
// is public, so the same RLS rule that powers /u/gaby allows it) and relabel
// the rows as the demo's "you" attendee. Maya and Leo stay curated. If the
// database is unreachable, the profile goes private, or anything else goes
// wrong, the demo silently falls back to the built-in seed — it must never
// break for a visitor.

/** The owner's account (public profile @gaby) — the demo's "You". */
const OWNER_ID = "7e3cbd40-4d8f-4b15-9171-b8d387c9220c";

/** How long a demo pageview may serve cached data before refetching. */
const REVALIDATE_SECONDS = 3600;

interface Row {
  id: string;
  user_id: string;
  artist: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  show_date: string;
  notes: string | null;
  rating: number | null;
  favorite_song_id: string | null;
  created_at: string;
  setlist_songs?: Show["setlist_songs"];
  show_media?: Show["show_media"];
}

/**
 * Shows for the public demo: the owner's live history as "you", plus the
 * curated friends. Falls back to the full static seed when the live read
 * fails or comes back empty.
 */
export async function loadDemoShows(): Promise<Show[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return DEMO_SHOWS;

  let rows: Row[];
  try {
    const select =
      "*,setlist_songs!setlist_songs_show_id_fkey(*),show_media(*)";
    const res = await fetch(
      `${url}/rest/v1/shows?user_id=eq.${OWNER_ID}&select=${encodeURIComponent(select)}&order=show_date.asc`,
      {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return DEMO_SHOWS;
    rows = (await res.json()) as Row[];
  } catch {
    return DEMO_SHOWS;
  }
  // Empty also means "profile no longer public" — RLS returns no rows to anon.
  if (!Array.isArray(rows) || rows.length === 0) return DEMO_SHOWS;

  const live: Show[] = rows.map((r) => ({
    ...r,
    user_id: "you",
    setlist_songs: (r.setlist_songs ?? [])
      .slice()
      .sort((a, b) => a.position - b.position),
    show_media: (r.show_media ?? [])
      .slice()
      .sort((a, b) => a.position - b.position),
  }));

  const friends = DEMO_SHOWS.filter((s) => s.user_id !== "you");
  return [...live, ...friends].sort((a, b) =>
    a.show_date.localeCompare(b.show_date)
  );
}
