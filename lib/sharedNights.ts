import type { Attendee } from "./demoShows";
import { showKey } from "./mutual";
import type { Show } from "./types";

// Friends v2 — turn the shows of me + my friends into two warm views:
//   • shared nights: my shows a friend was also at, whether I tagged them or we
//     both logged the same concert (same artist, date & city);
//   • friend activity: my friends' most recently added memories.

export interface SharedNight {
  showId: string;
  artist: string;
  venue: string | null;
  city: string | null;
  show_date: string;
  /** Friends who were there too (deduped). */
  friends: { id: string; label: string }[];
  /** True when at least one friend was explicitly tagged (vs. only inferred). */
  tagged: boolean;
}

export interface FriendMemory {
  show: Show;
  friendId: string;
  friendLabel: string;
}

function labelOf(attendees: Attendee[]): Map<string, string> {
  return new Map(attendees.map((a) => [a.id, a.label]));
}

/**
 * Nights I shared with friends, newest first. A friend counts for one of my
 * shows if I tagged them on it, or if their own history holds the same concert.
 */
export function computeSharedNights(
  shows: Show[],
  attendees: Attendee[],
  myId: string | null
): SharedNight[] {
  if (!myId) return [];
  const labels = labelOf(attendees);
  const friendIds = new Set(
    attendees.map((a) => a.id).filter((id) => id !== myId)
  );

  const myShows = shows.filter((s) => s.user_id === myId);

  // A friend's concert keys, for inferring overlaps.
  const friendKeys = new Map<string, Set<string>>();
  for (const s of shows) {
    if (s.user_id === myId || !friendIds.has(s.user_id)) continue;
    let set = friendKeys.get(s.user_id);
    if (!set) friendKeys.set(s.user_id, (set = new Set()));
    set.add(showKey(s));
  }

  const nights: SharedNight[] = [];
  for (const s of myShows) {
    const withFriends = new Map<string, boolean>(); // friendId → wasTagged
    const key = showKey(s);

    // Explicit tags on this show.
    for (const a of s.show_attendees ?? []) {
      if (friendIds.has(a.friend_id)) withFriends.set(a.friend_id, true);
    }
    // Inferred overlaps: a friend logged the same concert.
    for (const [fid, keys] of friendKeys) {
      if (keys.has(key) && !withFriends.has(fid)) withFriends.set(fid, false);
    }

    if (withFriends.size === 0) continue;
    nights.push({
      showId: s.id,
      artist: s.artist,
      venue: s.venue,
      city: s.city,
      show_date: s.show_date,
      friends: [...withFriends.keys()].map((id) => ({
        id,
        label: labels.get(id) ?? "A friend",
      })),
      tagged: [...withFriends.values()].some(Boolean),
    });
  }

  return nights.sort((a, b) => b.show_date.localeCompare(a.show_date));
}

/** Friends' most recently added shows (their activity feed), newest first. */
export function friendActivity(
  shows: Show[],
  attendees: Attendee[],
  myId: string | null,
  limit = 8
): FriendMemory[] {
  const labels = labelOf(attendees);
  const friendIds = new Set(
    attendees.map((a) => a.id).filter((id) => id !== myId)
  );

  return shows
    .filter((s) => friendIds.has(s.user_id))
    .slice()
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, limit)
    .map((show) => ({
      show,
      friendId: show.user_id,
      friendLabel: labels.get(show.user_id) ?? "A friend",
    }));
}
