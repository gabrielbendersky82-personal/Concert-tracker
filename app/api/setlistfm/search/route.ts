import { NextResponse } from "next/server";

// Search setlist.fm for concerts (artist / city / year) via the server-held key.
// client → this route → api.setlist.fm/rest/1.0/search/setlists

interface FmSong {
  name?: string;
}
interface FmSetlist {
  id?: string;
  eventDate?: string; // dd-MM-yyyy
  artist?: { name?: string };
  venue?: {
    name?: string;
    city?: {
      name?: string;
      country?: { name?: string };
      coords?: { lat?: number; long?: number };
    };
  };
  sets?: { set?: { song?: FmSong[] }[] };
  tour?: { name?: string };
}

function mapSetlist(s: FmSetlist) {
  const setlist: string[] = [];
  for (const set of s.sets?.set ?? []) {
    for (const song of set.song ?? []) {
      if (song.name) setlist.push(song.name);
    }
  }
  let date = "";
  if (typeof s.eventDate === "string") {
    const [d, mo, y] = s.eventDate.split("-");
    if (y && mo && d) date = `${y}-${mo}-${d}`;
  }
  const city = s.venue?.city;
  const coords = city?.coords;
  return {
    id: s.id ?? "",
    artist: s.artist?.name ?? "",
    venue: s.venue?.name ?? "",
    city: city?.name ?? "",
    country: city?.country?.name ?? "",
    date,
    tour: s.tour?.name ?? null,
    latitude: typeof coords?.lat === "number" ? coords.lat : null,
    longitude: typeof coords?.long === "number" ? coords.long : null,
    setlist,
    songCount: setlist.length,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist")?.trim();
  const city = searchParams.get("city")?.trim();
  const year = searchParams.get("year")?.trim();
  const page = searchParams.get("page")?.trim() || "1";

  if (!artist && !city) {
    return NextResponse.json(
      { error: "Enter an artist or city to search." },
      { status: 400 }
    );
  }

  const apiKey = process.env.SETLIST_FM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "setlist.fm search isn't set up yet. Add a SETLIST_FM_API_KEY." },
      { status: 501 }
    );
  }

  const qs = new URLSearchParams();
  if (artist) qs.set("artistName", artist);
  if (city) qs.set("cityName", city);
  if (year) qs.set("year", year);
  qs.set("p", page);

  let res: Response;
  try {
    res = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?${qs.toString()}`,
      { headers: { "x-api-key": apiKey, Accept: "application/json" } }
    );
  } catch {
    return NextResponse.json({ error: "Couldn't reach setlist.fm." }, { status: 502 });
  }

  // setlist.fm returns 404 when nothing matches.
  if (res.status === 404) {
    return NextResponse.json({ results: [], total: 0, page: Number(page) });
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: "setlist.fm returned an error. Check your API key." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    setlist?: FmSetlist[];
    total?: number;
    page?: number;
  };
  const results = (data.setlist ?? []).map(mapSetlist);
  return NextResponse.json({
    results,
    total: data.total ?? results.length,
    page: data.page ?? Number(page),
  });
}
