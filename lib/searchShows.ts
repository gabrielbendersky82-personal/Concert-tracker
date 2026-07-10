import type { Show } from "./types";

/**
 * Case-insensitive multi-term match over a show's artist, venue, city,
 * country, year and notes. Every whitespace-separated term must hit
 * somewhere, so "radiohead 2017" or "barcelona 2026" narrow as expected.
 */
export function matchesQuery(show: Show, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    show.artist,
    show.venue,
    show.city,
    show.country,
    show.show_date.slice(0, 4),
    show.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}
