import { NextResponse } from "next/server";

// ── Phase 2 stub ─────────────────────────────────────────────────────────────
// setlist.fm blocks browser/CORS requests and the API key must stay server-side,
// so auto-import will be forwarded through here: client → this route → setlist.fm,
// reading the key from process.env.SETLIST_FM_API_KEY. Manual setlist entry is
// the day-one path, so this endpoint intentionally returns Not Implemented.
export async function GET() {
  return NextResponse.json(
    {
      error:
        "setlist.fm auto-import is coming in phase 2. Enter setlists manually for now.",
    },
    { status: 501 }
  );
}
