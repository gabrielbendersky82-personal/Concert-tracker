import type { NewShowInput } from "./types";

/**
 * A few real venues (with coordinates) so the map isn't empty on first login.
 * Swap these for your own shows anytime — they're just seed data.
 */
export const SAMPLE_SHOWS: NewShowInput[] = [
  {
    artist: "Radiohead",
    venue: "Madison Square Garden",
    city: "New York",
    country: "United States",
    show_date: "2018-07-14",
    notes: "Sample show — delete me!",
    latitude: 40.7505,
    longitude: -73.9934,
    setlist: [
      "Daydreaming",
      "Ful Stop",
      "15 Step",
      "Lucky",
      "The National Anthem",
      "Karma Police",
      "Paranoid Android",
    ],
  },
  {
    artist: "Arctic Monkeys",
    venue: "The O2 Arena",
    city: "London",
    country: "United Kingdom",
    show_date: "2018-09-09",
    notes: "Sample show — delete me!",
    latitude: 51.503,
    longitude: 0.0032,
    setlist: [
      "Four Out of Five",
      "Brianstorm",
      "Crying Lightning",
      "Do I Wanna Know?",
      "505",
      "R U Mine?",
    ],
  },
  {
    artist: "Tame Impala",
    venue: "Red Rocks Amphitheatre",
    city: "Morrison",
    country: "United States",
    show_date: "2019-05-30",
    notes: "Sample show — delete me!",
    latitude: 39.6655,
    longitude: -105.205,
    setlist: [
      "Let It Happen",
      "Borderline",
      "The Less I Know the Better",
      "Elephant",
      "Feels Like We Only Go Backwards",
      "New Person, Same Old Mistakes",
    ],
  },
];
