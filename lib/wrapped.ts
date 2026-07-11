import { todayISO } from "./upcoming";
import type { Show } from "./types";

/**
 * Concert Wrapped: the numbers behind a year-in-live-music recap story.
 * Computed over ONE person's shows (Wrapped is personal, not the friend mix).
 */

export interface WrappedData {
  year: string;
  count: number;
  venueCount: number;
  cityNames: string[]; // unique, display-cased, in first-visit order
  countryCount: number;
  /** Rough km covered hopping between shows chronologically. */
  km: number;
  topArtists: { name: string; count: number }[];
  /** The highest-rated night (ties: favorite song, then setlist size). */
  bestNight: Show | null;
  bestSong: string | null;
  busiestMonth: { name: string; count: number } | null;
  firstShow: Show | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Years (desc) that have at least one non-future show. */
export function wrappedYears(shows: Show[], today = todayISO()): string[] {
  const years = new Set<string>();
  for (const s of shows) {
    if (s.show_date <= today) years.add(s.show_date.slice(0, 4));
  }
  return [...years].sort().reverse();
}

export function computeWrapped(
  shows: Show[],
  year: string,
  today = todayISO()
): WrappedData | null {
  const inYear = shows
    .filter((s) => s.show_date.slice(0, 4) === year && s.show_date <= today)
    .sort((a, b) => a.show_date.localeCompare(b.show_date));
  if (inYear.length === 0) return null;

  const venues = new Set<string>();
  const countries = new Set<string>();
  const cityNames: string[] = [];
  const citySeen = new Set<string>();
  const artistCounts = new Map<string, number>();
  const monthCounts = new Array(12).fill(0) as number[];

  let km = 0;
  let prev: { latitude: number; longitude: number } | null = null;

  for (const s of inYear) {
    if (s.venue?.trim()) venues.add(s.venue.trim().toLowerCase());
    if (s.country?.trim()) countries.add(s.country.trim().toLowerCase());
    const cityKey = s.city?.trim().toLowerCase();
    if (cityKey && !citySeen.has(cityKey)) {
      citySeen.add(cityKey);
      cityNames.push(s.city!.trim());
    }
    artistCounts.set(s.artist, (artistCounts.get(s.artist) ?? 0) + 1);
    monthCounts[Number(s.show_date.slice(5, 7)) - 1] += 1;
    if (s.latitude != null && s.longitude != null) {
      const here = { latitude: s.latitude, longitude: s.longitude };
      if (prev) km += haversineKm(prev, here);
      prev = here;
    }
  }

  const topArtists = [...artistCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 3);

  const bestNight =
    [...inYear].sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        Number(!!b.favorite_song_id) - Number(!!a.favorite_song_id) ||
        b.setlist_songs.length - a.setlist_songs.length
    )[0] ?? null;
  const bestSong =
    bestNight?.favorite_song_id != null
      ? bestNight.setlist_songs.find((s) => s.id === bestNight.favorite_song_id)
          ?.title ?? null
      : null;

  const busiestIdx = monthCounts.indexOf(Math.max(...monthCounts));
  const busiestMonth =
    monthCounts[busiestIdx] > 0
      ? { name: MONTHS[busiestIdx], count: monthCounts[busiestIdx] }
      : null;

  return {
    year,
    count: inYear.length,
    venueCount: venues.size,
    cityNames,
    countryCount: countries.size,
    km: Math.round(km),
    topArtists,
    bestNight,
    bestSong,
    busiestMonth,
    firstShow: inYear[0] ?? null,
  };
}
