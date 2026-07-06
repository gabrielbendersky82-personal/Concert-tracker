import { NextResponse } from "next/server";

// ── setlist.fm import proxy ──────────────────────────────────────────────────
// setlist.fm blocks browser/CORS requests by design and the API key must stay
// server-side, so the client forwards a setlist.fm URL here and we call the
// REST API on its behalf: client → this route → api.setlist.fm.
// Requires a free (non-commercial) key in SETLIST_FM_API_KEY.

/** Pull the setlist id from a full setlist.fm URL, or accept a bare id. */
function extractSetlistId(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/-([0-9a-fA-F]{6,})\.html/);
  if (fromUrl) return fromUrl[1];
  if (/^[0-9a-fA-F]{6,}$/.test(trimmed)) return trimmed;
  return null;
}

interface SetlistFmSong {
  name?: string;
  tape?: boolean;
}
interface SetlistFmResponse {
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
  sets?: { set?: { song?: SetlistFmSong[] }[] };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url") ?? searchParams.get("id") ?? "";
  const id = extractSetlistId(raw);

  if (!id) {
    return NextResponse.json(
      { error: "Paste a setlist.fm setlist URL." },
      { status: 400 }
    );
  }

  const apiKey = process.env.SETLIST_FM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "setlist.fm import isn't set up yet. Add a SETLIST_FM_API_KEY to enable it.",
      },
      { status: 501 }
    );
  }

  let res: Response;
  try {
    res = await fetch(`https://api.setlist.fm/rest/1.0/setlist/${id}`, {
      headers: { "x-api-key": apiKey, Accept: "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach setlist.fm." },
      { status: 502 }
    );
  }

  if (res.status === 404) {
    return NextResponse.json(
      { error: "That setlist wasn't found." },
      { status: 404 }
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: "setlist.fm returned an error. Check your API key." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as SetlistFmResponse;

  const setlist: string[] = [];
  for (const set of data.sets?.set ?? []) {
    for (const song of set.song ?? []) {
      if (song.name) setlist.push(song.name);
    }
  }

  let date = "";
  if (typeof data.eventDate === "string") {
    const [d, mo, y] = data.eventDate.split("-");
    if (y && mo && d) date = `${y}-${mo}-${d}`;
  }

  const city = data.venue?.city;
  const coords = city?.coords;

  return NextResponse.json({
    result: {
      artist: data.artist?.name ?? "",
      venue: data.venue?.name ?? "",
      city: city?.name ?? "",
      country: city?.country?.name ?? "",
      date,
      latitude: typeof coords?.lat === "number" ? coords.lat : null,
      longitude: typeof coords?.long === "number" ? coords.long : null,
      setlist,
    },
  });
}
