import { createClient } from "./supabase/client";
import type { NewShowInput, Show } from "./types";

/** Fetch the signed-in user's shows with setlists (RLS scopes to the owner). */
export async function fetchShows(): Promise<Show[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shows")
    .select("*, setlist_songs(*)")
    .order("show_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((show) => ({
    ...show,
    setlist_songs: [...(show.setlist_songs ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  })) as Show[];
}

/** Fetch a specific user's shows (RLS permits this only for accepted friends). */
export async function fetchShowsFor(userId: string): Promise<Show[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shows")
    .select("*, setlist_songs(*)")
    .eq("user_id", userId)
    .order("show_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((show) => ({
    ...show,
    setlist_songs: [...(show.setlist_songs ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  })) as Show[];
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
