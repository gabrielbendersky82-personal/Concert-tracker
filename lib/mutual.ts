import type { Show } from "./types";

/** Normalized identity of a concert: same artist, date, and city → same show. */
export function showKey(s: Show): string {
  const artist = (s.artist ?? "").trim().toLowerCase();
  const city = (s.city ?? "").trim().toLowerCase();
  return `${artist}|${s.show_date}|${city}`;
}

/** Shows the current user attended that a friend also attended. */
export function findMutual(mine: Show[], theirs: Show[]): Show[] {
  const theirKeys = new Set(theirs.map(showKey));
  return mine
    .filter((s) => theirKeys.has(showKey(s)))
    .sort((a, b) => b.show_date.localeCompare(a.show_date));
}
