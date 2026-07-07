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

// ── Dashboard analytics ──────────────────────────────────────────────────────

export interface RankItem {
  label: string;
  count: number;
}

export interface DashboardData {
  totalShows: number;
  uniqueArtists: number;
  uniqueVenues: number;
  uniqueCities: number;
  uniqueCountries: number;
  totalSongs: number;
  uniqueSongs: number;
  avgSetlist: number;
  showsPerYear: { year: string; count: number }[];
  cumulative: { year: string; total: number }[];
  byMonth: { month: string; count: number }[];
  topArtists: RankItem[];
  topVenues: RankItem[];
  topCities: RankItem[];
  topSongs: RankItem[];
  countries: RankItem[];
  milestones: {
    firstShow: { artist: string; date: string } | null;
    latestShow: { artist: string; date: string } | null;
    biggestYear: { year: string; count: number } | null;
    longestGapDays: number | null;
  };
}

/** Case-insensitive tally that keeps the first-seen display label. */
function tallier() {
  const m = new Map<string, RankItem>();
  return {
    add(raw?: string | null) {
      const label = raw?.trim();
      if (!label) return;
      const key = label.toLowerCase();
      const existing = m.get(key);
      if (existing) existing.count += 1;
      else m.set(key, { label, count: 1 });
    },
    get size() {
      return m.size;
    },
    top(n: number): RankItem[] {
      return [...m.values()]
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
        .slice(0, n);
    },
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function computeDashboard(shows: Show[]): DashboardData {
  const artists = tallier();
  const venues = tallier();
  const citiesT = tallier();
  const countriesT = tallier();
  const songs = tallier();
  const yearCounts = new Map<string, number>();
  const monthCounts = new Array(12).fill(0);
  let totalSongs = 0;
  let showsWithSetlist = 0;

  for (const show of shows) {
    artists.add(show.artist);
    venues.add(show.venue);
    citiesT.add(show.city);
    countriesT.add(show.country);

    const year = show.show_date?.slice(0, 4);
    if (year) yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);

    const monthStr = show.show_date?.slice(5, 7);
    const monthIdx = monthStr ? Number(monthStr) - 1 : -1;
    if (monthIdx >= 0 && monthIdx < 12) monthCounts[monthIdx] += 1;

    const setlist = show.setlist_songs ?? [];
    let songsInShow = 0;
    for (const song of setlist) {
      if (song.title?.trim()) {
        totalSongs += 1;
        songsInShow += 1;
        songs.add(song.title);
      }
    }
    if (songsInShow > 0) showsWithSetlist += 1;
  }

  const showsPerYear = [...yearCounts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));

  let running = 0;
  const cumulative = showsPerYear.map(({ year, count }) => {
    running += count;
    return { year, total: running };
  });

  const byMonth = MONTHS.map((month, i) => ({ month, count: monthCounts[i] }));

  const biggestYear = showsPerYear.reduce<{ year: string; count: number } | null>(
    (best, y) => (!best || y.count > best.count ? y : best),
    null
  );

  // Milestones from date-sorted shows.
  const dated = shows
    .filter((s) => s.show_date && !Number.isNaN(new Date(s.show_date).getTime()))
    .sort((a, b) => a.show_date.localeCompare(b.show_date));

  const firstShow = dated[0]
    ? { artist: dated[0].artist, date: dated[0].show_date }
    : null;
  const latestShow = dated.length
    ? { artist: dated[dated.length - 1].artist, date: dated[dated.length - 1].show_date }
    : null;

  let longestGapDays: number | null = null;
  for (let i = 1; i < dated.length; i++) {
    const gap = Math.round(
      (new Date(dated[i].show_date).getTime() -
        new Date(dated[i - 1].show_date).getTime()) /
        86_400_000
    );
    if (longestGapDays === null || gap > longestGapDays) longestGapDays = gap;
  }

  return {
    totalShows: shows.length,
    uniqueArtists: artists.size,
    uniqueVenues: venues.size,
    uniqueCities: citiesT.size,
    uniqueCountries: countriesT.size,
    totalSongs,
    uniqueSongs: songs.size,
    avgSetlist: showsWithSetlist ? Math.round((totalSongs / showsWithSetlist) * 10) / 10 : 0,
    showsPerYear,
    cumulative,
    byMonth,
    topArtists: artists.top(8),
    topVenues: venues.top(8),
    topCities: citiesT.top(8),
    topSongs: songs.top(8),
    countries: countriesT.top(12),
    milestones: { firstShow, latestShow, biggestYear, longestGapDays },
  };
}

