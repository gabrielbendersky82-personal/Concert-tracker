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
  created_at: string;
  setlist_songs: SetlistSong[];
  show_media?: ShowMedia[];
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
