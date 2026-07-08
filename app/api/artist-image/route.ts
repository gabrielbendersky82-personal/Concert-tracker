// Proxy an artist photo from Deezer's public API (no key required).
// We return the image bytes from our own origin so it works in the timeline's
// PNG export (no cross-origin canvas tainting) and hides the upstream.
// Responds 404 when no usable photo is found → the client shows an initial.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  if (!name) return new Response(null, { status: 400 });

  try {
    const search = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`,
      { headers: { Accept: "application/json" } }
    );
    if (!search.ok) return new Response(null, { status: 404 });

    const data = (await search.json()) as {
      data?: { picture_big?: string; picture_medium?: string }[];
    };
    const artist = data.data?.[0];
    const pic = artist?.picture_big || artist?.picture_medium || "";
    // Deezer's "no image" placeholder has an empty id (…/artist//…).
    if (!pic || pic.includes("/artist//")) {
      return new Response(null, { status: 404 });
    }

    const img = await fetch(pic);
    if (!img.ok) return new Response(null, { status: 404 });
    const buf = await img.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": img.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
