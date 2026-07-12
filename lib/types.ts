export interface SetlistSong {
  id: string;
  show_id: string;
  position: number;
  title: string;
}

export interface ShowMedia {
  id: string;
  show_id: string;
  kind: "photo" | "video";
  storage_path: string | null;
  youtube_id: string | null;
  caption: string | null;
  position: number;
  created_at?: string;
  /** Direct URL, used only by the in-memory demo dataset. */
  url?: string;
}

/** A friend the show's owner tagged as having been there too. */
export interface ShowAttendee {
  friend_id: string;
  /** Embedded profile (may be null if the viewer can't read that profile). */
  profiles?: {
    id: string;
    handle: string;
    display_name: string | null;
  } | null;
  /** Display label used by the in-memory demo dataset (no profiles embed). */
  label?: string;
}

export interface Show {
  id: string;
  user_id: string;
  artist: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  show_date: string; // ISO date (YYYY-MM-DD)
  notes: string | null;
  /** 1–5 dots; null/undefined = unrated. */
  rating?: number | null;
  /** "Song of the night" — id of one of the show's setlist_songs. */
  favorite_song_id?: string | null;
  created_at: string;
  setlist_songs: SetlistSong[];
  show_media?: ShowMedia[];
  /** Friends the owner tagged as also attending (Friends v2). */
  show_attendees?: ShowAttendee[];
}

/** Friendly name for a tagged attendee, from the embedded profile or a label. */
export function attendeeName(a: ShowAttendee): string {
  return (
    a.profiles?.display_name ||
    (a.profiles?.handle ? `@${a.profiles.handle}` : "") ||
    a.label ||
    "A friend"
  );
}

export interface Profile {
  id: string;
  handle: string;
  display_name: string | null;
  is_public?: boolean;
  created_at?: string;
}

export interface Friendship {
  id: string;
  requester: string;
  addressee: string;
  status: "pending" | "accepted";
  created_at?: string;
}

export type FriendState =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "accepted"
  | "self";

/** Shape used when creating a show from the add-show form. */
export interface NewShowInput {
  artist: string;
  venue: string;
  city: string;
  country: string;
  show_date: string;
  notes: string;
  setlist: string[]; // one title per entry, in order
  latitude?: number | null;
  longitude?: number | null;
}
