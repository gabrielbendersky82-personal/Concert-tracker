import type { NewShowInput, Show } from "./types";

/**
 * Demo-mode "database": shows a demo visitor adds live in their browser's
 * localStorage — nothing is written to the real backend. They're merged with
 * the curated DEMO_SHOWS across the map, timeline and dashboard, survive
 * reloads on the same device, and can be deleted again.
 */

const KEY = "cm_demo_shows";
const ID_PREFIX = "demo-local-";

export function isDemoLocalId(id: string): boolean {
  return id.startsWith(ID_PREFIX);
}

export function loadDemoLocalShows(): Show[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Show[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(shows: Show[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(shows));
  } catch {
    /* storage full/blocked — the show still lives in React state this visit */
  }
}

/** Build a Show from the add-form input and persist it. */
export function addDemoLocalShow(input: NewShowInput): Show {
  const id = `${ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const show: Show = {
    id,
    user_id: "you",
    artist: input.artist.trim(),
    venue: input.venue.trim() || null,
    city: input.city.trim() || null,
    country: input.country.trim() || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    show_date: input.show_date,
    notes: input.notes.trim() || null,
    rating: null,
    favorite_song_id: null,
    created_at: new Date().toISOString(),
    setlist_songs: input.setlist
      .map((t) => t.trim())
      .filter(Boolean)
      .map((title, i) => ({
        id: `${id}-song-${i + 1}`,
        show_id: id,
        position: i + 1,
        title,
      })),
    show_media: [],
  };
  save([show, ...loadDemoLocalShows()]);
  return show;
}

export function deleteDemoLocalShow(id: string): void {
  save(loadDemoLocalShows().filter((s) => s.id !== id));
}
