import { createClient } from "./supabase/client";
import type { NewShowInput, Show } from "./types";

const SELECT_WITH_MEDIA = "*, setlist_songs(*), show_media(*)";
const SELECT_NO_MEDIA = "*, setlist_songs(*)";

/**
 * Select shows, retrying without the `show_media` embed if that table isn't
 * present yet (migration 0004). Keeps the app working before the migration is
 * applied; media simply won't appear until then.
 */
async function selectShows(
  build: (select: string) => PromiseLike<{ data: unknown; error: unknown }>
): Promise<Show[]> {
  let { data, error } = await build(SELECT_WITH_MEDIA);
  if (error) {
    ({ data, error } = await build(SELECT_NO_MEDIA));
    if (error) throw error;
  }
  const rows = (data as Parameters<typeof sortShowRelations>[0][]) ?? [];
  return rows.map(sortShowRelations) as Show[];
}

/** Fetch the signed-in user's OWN shows with setlists. */
export async function fetchShows(): Promise<Show[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  // Filter by owner explicitly: RLS also permits reading friends' and public
  // profiles' shows, so relying on RLS alone would merge in others' concerts.
  return selectShows((select) =>
    supabase
      .from("shows")
      .select(select)
      .eq("user_id", user.id)
      .order("show_date", { ascending: false })
  );
}

/** Fetch a specific user's shows (RLS permits this only for accepted friends). */
export async function fetchShowsFor(userId: string): Promise<Show[]> {
  const supabase = createClient();
  return selectShows((select) =>
    supabase
      .from("shows")
      .select(select)
      .eq("user_id", userId)
      .order("show_date", { ascending: false })
  );
}

/** Sort a show's setlist songs and media by position. */
function sortShowRelations(show: {
  setlist_songs?: { position: number }[];
  show_media?: { position: number }[];
}) {
  return {
    ...show,
    setlist_songs: [...(show.setlist_songs ?? [])].sort(
      (a, b) => a.position - b.position
    ),
    show_media: [...(show.show_media ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  };
}

/** Insert one show plus its setlist songs. Returns the new show id. */
export async function createShow(input: NewShowInput): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: show, error } = await supabase
    .from("shows")
    .insert({
      user_id: user.id,
      artist: input.artist.trim(),
      venue: input.venue.trim() || null,
      city: input.city.trim() || null,
      country: input.country.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      show_date: input.show_date,
      notes: input.notes.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const songs = input.setlist
    .map((title) => title.trim())
    .filter(Boolean)
    .map((title, index) => ({
      show_id: show.id as string,
      position: index + 1,
      title,
    }));

  if (songs.length) {
    const { error: songError } = await supabase
      .from("setlist_songs")
      .insert(songs);
    if (songError) throw songError;
  }

  return show.id as string;
}

export async function deleteShow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("shows").delete().eq("id", id);
  if (error) throw error;
}

/** Set or clear a show's 1–5 rating. */
export async function updateShowRating(
  id: string,
  rating: number | null
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("shows")
    .update({ rating })
    .eq("id", id);
  if (error) throw error;
}

/** Set or clear the "song of the night" (must be one of the show's songs). */
export async function updateFavoriteSong(
  id: string,
  songId: string | null
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("shows")
    .update({ favorite_song_id: songId })
    .eq("id", id);
  if (error) throw error;
}

/** Insert many shows sequentially (used by import + sample seed). */
export async function bulkCreateShows(inputs: NewShowInput[]): Promise<number> {
  let created = 0;
  for (const input of inputs) {
    await createShow(input);
    created += 1;
  }
  return created;
}

export interface SetlistFmImport {
  artist: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  latitude: number | null;
  longitude: number | null;
  setlist: string[];
}

export interface SetlistFmResult extends SetlistFmImport {
  id: string;
  tour: string | null;
  songCount: number;
}

/** Search setlist.fm for concerts by artist / city / year. */
export async function searchSetlistFm(params: {
  artist?: string;
  city?: string;
  year?: string;
  page?: number;
}): Promise<SetlistFmResult[]> {
  const qs = new URLSearchParams();
  if (params.artist) qs.set("artist", params.artist);
  if (params.city) qs.set("city", params.city);
  if (params.year) qs.set("year", params.year);
  if (params.page) qs.set("page", String(params.page));

  const res = await fetch(`/api/setlistfm/search?${qs.toString()}`);
  const body = (await res.json()) as {
    results?: SetlistFmResult[];
    error?: string;
  };
  if (!res.ok) throw new Error(body.error ?? "Search failed.");
  return body.results ?? [];
}

/** Import a show from a setlist.fm URL via the server-side proxy. */
export async function importFromSetlistFm(
  urlOrId: string
): Promise<SetlistFmImport> {
  const res = await fetch(`/api/setlistfm?url=${encodeURIComponent(urlOrId)}`);
  const body = (await res.json()) as { result?: SetlistFmImport; error?: string };
  if (!res.ok || !body.result) {
    throw new Error(body.error ?? "Could not import from setlist.fm.");
  }
  return body.result;
}

/** Look up coordinates for a place string via the server geocode proxy. */
export async function geocode(
  query: string
): Promise<{ lat: number; lon: number; country: string | null } | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  const body = (await res.json()) as {
    result: { lat: number; lon: number; country: string | null } | null;
  };
  return body.result;
}
