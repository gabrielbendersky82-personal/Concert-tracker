import type { Show } from "./types";

/**
 * Curated, in-memory shows powering the public read-only demo (`/demo`).
 * These never touch Supabase — they're rendered directly so anyone can explore
 * the map, timeline and dashboard without an account. Spread across many years,
 * cities and countries so every view looks rich.
 */

interface DemoSeed {
  artist: string;
  venue: string;
  city: string;
  country: string;
  show_date: string;
  latitude: number;
  longitude: number;
  setlist: string[];
  photos?: string[]; // external image URLs (demo only)
  videos?: string[]; // YouTube ids
}

const SEED: DemoSeed[] = [
  {
    artist: "Radiohead",
    venue: "Madison Square Garden",
    city: "New York",
    country: "United States",
    show_date: "2016-07-27",
    latitude: 40.7505,
    longitude: -73.9934,
    setlist: ["Burn the Witch", "Daydreaming", "Lucky", "Karma Police", "Idioteque", "Paranoid Android"],
    photos: [
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80",
    ],
    videos: ["1uYWYWPc9HU"],
  },
  {
    artist: "Beyoncé",
    venue: "Wembley Stadium",
    city: "London",
    country: "United Kingdom",
    show_date: "2016-07-02",
    latitude: 51.556,
    longitude: -0.2796,
    setlist: ["Formation", "Sorry", "Hold Up", "Crazy in Love", "Halo"],
    photos: [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    ],
    videos: ["bnVUHWCynig"],
  },
  {
    artist: "Kendrick Lamar",
    venue: "Accor Arena",
    city: "Paris",
    country: "France",
    show_date: "2017-02-27",
    latitude: 48.8386,
    longitude: 2.3785,
    setlist: ["DNA.", "ELEMENT.", "King Kunta", "HUMBLE.", "Alright"],
  },
  {
    artist: "Arctic Monkeys",
    venue: "The O2 Arena",
    city: "London",
    country: "United Kingdom",
    show_date: "2018-09-09",
    latitude: 51.503,
    longitude: 0.0032,
    setlist: ["Four Out of Five", "Brianstorm", "Crying Lightning", "Do I Wanna Know?", "505", "R U Mine?"],
  },
  {
    artist: "Tame Impala",
    venue: "Red Rocks Amphitheatre",
    city: "Morrison",
    country: "United States",
    show_date: "2019-05-30",
    latitude: 39.6655,
    longitude: -105.205,
    setlist: ["Let It Happen", "Borderline", "The Less I Know the Better", "Elephant", "New Person, Same Old Mistakes"],
  },
  {
    artist: "Rosalía",
    venue: "Razzmatazz",
    city: "Barcelona",
    country: "Spain",
    show_date: "2019-07-12",
    latitude: 41.3979,
    longitude: 2.1929,
    setlist: ["Malamente", "Pienso en tu mirá", "Di Mi Nombre", "A Palé", "Con Altura"],
  },
  {
    artist: "The Strokes",
    venue: "Barclays Center",
    city: "Brooklyn",
    country: "United States",
    show_date: "2020-01-01",
    latitude: 40.6826,
    longitude: -73.9754,
    setlist: ["Bad Decisions", "The Adults Are Talking", "Reptilia", "Last Nite", "Hard to Explain"],
  },
  {
    artist: "Fontaines D.C.",
    venue: "Vicar Street",
    city: "Dublin",
    country: "Ireland",
    show_date: "2022-04-21",
    latitude: 53.3384,
    longitude: -6.2764,
    setlist: ["A Hero's Death", "Jackie Down the Line", "Boys in the Better Land", "I Love You"],
  },
  {
    artist: "Kaytranada",
    venue: "Palacio de Deportes",
    city: "Mexico City",
    country: "Mexico",
    show_date: "2022-11-19",
    latitude: 19.4053,
    longitude: -99.0993,
    setlist: ["10%", "Freefall", "Glowed Up", "Lite Spots"],
  },
  {
    artist: "Florence + the Machine",
    venue: "Ziggo Dome",
    city: "Amsterdam",
    country: "Netherlands",
    show_date: "2022-11-12",
    latitude: 52.3139,
    longitude: 4.9375,
    setlist: ["King", "Ship to Wreck", "Dog Days Are Over", "Shake It Out", "Rabbit Heart"],
  },
  {
    artist: "The Weeknd",
    venue: "MetLife Stadium",
    city: "East Rutherford",
    country: "United States",
    show_date: "2023-08-27",
    latitude: 40.8135,
    longitude: -74.0745,
    setlist: ["Take My Breath", "Blinding Lights", "Save Your Tears", "Starboy", "The Hills"],
    videos: ["4NRXx6U8ABQ"],
  },
  {
    artist: "Blur",
    venue: "Wembley Stadium",
    city: "London",
    country: "United Kingdom",
    show_date: "2023-07-08",
    latitude: 51.556,
    longitude: -0.2796,
    setlist: ["Song 2", "Parklife", "Girls & Boys", "Coffee & TV", "The Universal"],
  },
  {
    artist: "Fred again..",
    venue: "Sydney Opera House Forecourt",
    city: "Sydney",
    country: "Australia",
    show_date: "2024-02-24",
    latitude: -33.8568,
    longitude: 151.2153,
    setlist: ["Delilah (pull me out of this)", "Rumble", "Turn On the Lights again..", "Marea (we've lost dancing)"],
  },
  {
    artist: "Sampha",
    venue: "The Fillmore",
    city: "San Francisco",
    country: "United States",
    show_date: "2024-04-03",
    latitude: 37.7842,
    longitude: -122.4331,
    setlist: ["Spirit 2.0", "Blood on Me", "Plastic 100°C", "(No One Knows Me) Like the Piano"],
  },
  {
    artist: "Little Simz",
    venue: "O2 Academy Brixton",
    city: "London",
    country: "United Kingdom",
    show_date: "2024-10-18",
    latitude: 51.4655,
    longitude: -0.115,
    setlist: ["Introvert", "Gorilla", "Woman", "Venom", "Point and Kill"],
  },
  {
    artist: "Bad Bunny",
    venue: "Estadio Monumental",
    city: "Santiago",
    country: "Chile",
    show_date: "2025-02-11",
    latitude: -33.5089,
    longitude: -70.6053,
    setlist: ["Tití Me Preguntó", "Me Porto Bonito", "Yonaguni", "Dákiti", "Callaíta"],
  },
];

export const DEMO_SHOWS: Show[] = SEED.map((s, i) => {
  const id = `demo-${i + 1}`;
  const media = [
    ...(s.photos ?? []).map((url, j) => ({
      id: `${id}-photo-${j + 1}`,
      show_id: id,
      kind: "photo" as const,
      storage_path: null,
      youtube_id: null,
      caption: null,
      position: j,
      url,
    })),
    ...(s.videos ?? []).map((vid, j) => ({
      id: `${id}-video-${j + 1}`,
      show_id: id,
      kind: "video" as const,
      storage_path: null,
      youtube_id: vid,
      caption: null,
      position: (s.photos?.length ?? 0) + j,
    })),
  ];
  return {
    id,
    user_id: "demo",
    artist: s.artist,
    venue: s.venue,
    city: s.city,
    country: s.country,
    latitude: s.latitude,
    longitude: s.longitude,
    show_date: s.show_date,
    notes: null,
    created_at: `${s.show_date}T00:00:00.000Z`,
    setlist_songs: s.setlist.map((title, j) => ({
      id: `${id}-song-${j + 1}`,
      show_id: id,
      position: j + 1,
      title,
    })),
    show_media: media,
  };
});

/** Handle shown in the demo chrome. */
export const DEMO_HANDLE = "demo";
