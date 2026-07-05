import { NextResponse } from "next/server";

// Server-side proxy to Nominatim (OpenStreetMap). Keeps the required
// User-Agent header server-side and honours their usage policy.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(
    q
  )}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ConcertMap/1.0 (personal concert tracker)",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service error" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: { country?: string };
    }>;

    if (!data.length) {
      return NextResponse.json({ result: null });
    }

    const top = data[0];
    return NextResponse.json({
      result: {
        lat: parseFloat(top.lat),
        lon: parseFloat(top.lon),
        display_name: top.display_name,
        country: top.address?.country ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach geocoding service" },
      { status: 502 }
    );
  }
}
