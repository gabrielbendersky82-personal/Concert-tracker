import type { Show } from "./types";

export interface Stats {
  totalShows: number;
  totalSongs: number;
  cities: number;
  countries: number;
  mostSeenArtist: { name: string; count: number } | null;
  mostPlayedTrack: { title: string; count: number } | null;
  showsPerYear: { year: string; count: number }[];
}

function topEntry(counts: Map<string, number>): { key: string; count: number } | null {
  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

export function computeStats(shows: Show[]): Stats {
  const artistCounts = new Map<string, number>();
  const trackCounts = new Map<string, number>();
  const cities = new Set<string>();
  const countries = new Set<string>();
  const yearCounts = new Map<string, number>();
  let totalSongs = 0;

  for (const show of shows) {
    const artist = show.artist?.trim();
    if (artist) artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);

    if (show.city?.trim()) cities.add(show.city.trim().toLowerCase());
    if (show.country?.trim()) countries.add(show.country.trim().toLowerCase());

    const year = show.show_date?.slice(0, 4);
    if (year) yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);

    for (const song of show.setlist_songs ?? []) {
      const title = song.title?.trim();
      if (!title) continue;
      totalSongs += 1;
      const key = title.toLowerCase();
      trackCounts.set(key, (trackCounts.get(key) ?? 0) + 1);
    }
  }

  // Recover a nicely-cased label for the most-played track.
  const bestTrack = topEntry(trackCounts);
  let mostPlayedTrack: Stats["mostPlayedTrack"] = null;
  if (bestTrack) {
    let label = bestTrack.key;
    for (const show of shows) {
      const match = (show.setlist_songs ?? []).find(
        (s) => s.title?.trim().toLowerCase() === bestTrack.key
      );
      if (match) {
        label = match.title.trim();
        break;
      }
    }
    mostPlayedTrack = { title: label, count: bestTrack.count };
  }

  const bestArtist = topEntry(artistCounts);

  const showsPerYear = [...yearCounts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));

  return {
    totalShows: shows.length,
    totalSongs,
    cities: cities.size,
    countries: countries.size,
    mostSeenArtist: bestArtist ? { name: bestArtist.key, count: bestArtist.count } : null,
    mostPlayedTrack,
    showsPerYear,
  };
}
