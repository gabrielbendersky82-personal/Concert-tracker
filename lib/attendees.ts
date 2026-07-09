import type { Attendee } from "./demoShows";
import type { Profile } from "./types";

/** Your own color on the shared/combined maps. */
export const ME_COLOR = "#4f46e5";

/** Palette cycled through for friends (skips the "you" indigo). */
export const FRIEND_COLORS = [
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#d946ef",
];

/**
 * Build the attendee list (You + friends) used to color shows by whose they are.
 * `id` matches each show's `user_id`.
 */
export function buildAttendees(myId: string, friends: Profile[]): Attendee[] {
  return [
    { id: myId, label: "You", color: ME_COLOR },
    ...friends.map((f, i) => ({
      id: f.id,
      label: f.display_name || `@${f.handle}`,
      color: FRIEND_COLORS[i % FRIEND_COLORS.length],
    })),
  ];
}
