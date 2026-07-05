export interface SetlistSong {
  id: string;
  show_id: string;
  position: number;
  title: string;
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
}

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
