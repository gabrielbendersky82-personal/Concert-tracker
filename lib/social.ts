import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAttendees } from "./attendees";
import type { Attendee } from "./demoShows";
import type { Friendship, Profile, Show } from "./types";

const SELECT_WITH_MEDIA = "*, setlist_songs(*), show_media(*)";
const SELECT_NO_MEDIA = "*, setlist_songs(*)";

function sortRelations(show: {
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

export interface MineAndFriends {
  shows: Show[];
  attendees: Attendee[];
  myId: string | null;
}

/**
 * Load the signed-in user's shows plus their accepted friends' shows, tagged with
 * an attendee list (You + each friend, color-coded). Works with either the browser
 * or server Supabase client. RLS already permits reading accepted friends' rows.
 */
export async function loadMineAndFriends(
  supabase: SupabaseClient
): Promise<MineAndFriends> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { shows: [], attendees: [], myId: null };

  // Accepted friendships (RLS restricts these to rows I'm part of).
  const { data: frRows } = await supabase
    .from("friendships")
    .select("requester, addressee, status")
    .eq("status", "accepted");
  const friendIds = [
    ...new Set(
      ((frRows ?? []) as Friendship[])
        .map((f) => (f.requester === user.id ? f.addressee : f.requester))
        .filter((id) => id !== user.id)
    ),
  ];

  const ids = [user.id, ...friendIds];

  // One query for mine + friends' shows (RLS's are_friends policy allows theirs).
  let { data: rows, error } = await supabase
    .from("shows")
    .select(SELECT_WITH_MEDIA)
    .in("user_id", ids)
    .order("show_date", { ascending: false });
  if (error) {
    ({ data: rows, error } = await supabase
      .from("shows")
      .select(SELECT_NO_MEDIA)
      .in("user_id", ids)
      .order("show_date", { ascending: false }));
    if (error) throw error;
  }
  const shows = ((rows as Parameters<typeof sortRelations>[0][]) ?? []).map(
    sortRelations
  ) as Show[];

  // Friend profiles for labels/colors.
  let friends: Profile[] = [];
  if (friendIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", friendIds);
    friends = (profs ?? []) as Profile[];
  }

  return {
    shows,
    attendees: buildAttendees(user.id, friends),
    myId: user.id,
  };
}
