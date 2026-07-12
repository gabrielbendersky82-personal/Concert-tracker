import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Ticket photo scan ────────────────────────────────────────────────────────
// The client sends a photo of a concert ticket (old paper stubs or modern QR
// e-tickets); Claude reads it and returns the show details to prefill the add
// form. The Anthropic key stays server-side, so the client posts the image
// here: client → this route → Anthropic API.
// Requires ANTHROPIC_API_KEY. Signed-in users scan freely; demo visitors get a
// small per-browser-session allowance (each scan costs real money), enforced
// here via a session cookie — the client UI is informational only.

/** Extraction runs on Haiku (fast + cheap, plenty for reading tickets);
 *  override with TICKET_SCAN_MODEL to escalate if faded stubs misread. */
const MODEL = process.env.TICKET_SCAN_MODEL || "claude-haiku-4-5";

/** Demo allowance: scans per browser session for signed-out visitors. */
const DEMO_SCAN_LIMIT = 2;
/** Session cookie (no max-age → cleared when the browser closes). */
const DEMO_COOKIE = "cm_demo_scans";

const LIMIT_MESSAGE =
  "You've used both demo scans for this session. Sign in to scan as many tickets as you like.";

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

// ~4 MB of base64 (~3 MB image) — the client downscales before uploading, so
// anything bigger than this is a bug or abuse, and Vercel caps bodies anyway.
const MAX_BASE64_LENGTH = 4 * 1024 * 1024;

const PROMPT = `This is a photo of a concert ticket (it may be an old paper stub or a modern e-ticket with a QR code). Read everything printed on it and extract the concert details.

Reply with ONLY a JSON object, no other text:
{
  "is_ticket": boolean,        // false if this clearly isn't a concert ticket
  "artist": string | null,     // the headline performer or band
  "venue": string | null,      // venue name only, without the city
  "city": string | null,
  "country": string | null,    // full country name, inferred from venue/city if not printed
  "date": string | null,       // the event date as YYYY-MM-DD; null if not readable
  "note": string | null        // anything ambiguous a human should double-check, one short sentence
}

Rules:
- Transcribe names exactly as printed (fix obvious OCR-style casing like "RADIOHEAD" -> "Radiohead").
- The date on tickets can appear in many formats (DD.MM.YY, MM/DD/YYYY, "SAT JUL 12 2008"...). Convert carefully to YYYY-MM-DD. If the day/month order is genuinely ambiguous, pick the more likely reading and mention it in "note".
- Ignore prices, seat numbers, barcodes, and ticket-agency names (Ticketmaster, Eventim...) — the venue is the physical place, not the seller.
- If a field isn't on the ticket and can't be safely inferred, use null. Never invent details.`;

interface Extracted {
  is_ticket?: boolean;
  artist?: string | null;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  date?: string | null;
  note?: string | null;
}

function cleanField(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Demo visitors: enforce the per-session allowance before spending anything.
  const cookieStore = await cookies();
  let demoScansUsed = 0;
  if (!user) {
    demoScansUsed = parseInt(cookieStore.get(DEMO_COOKIE)?.value ?? "0", 10);
    if (!Number.isFinite(demoScansUsed) || demoScansUsed < 0) demoScansUsed = 0;
    if (demoScansUsed >= DEMO_SCAN_LIMIT) {
      return NextResponse.json({ error: LIMIT_MESSAGE }, { status: 429 });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Ticket scanning isn't set up yet. Add an ANTHROPIC_API_KEY to enable it.",
      },
      { status: 501 }
    );
  }

  let body: { image?: unknown; mediaType?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image : "";
  const mediaType = MEDIA_TYPES.includes(body.mediaType as MediaType)
    ? (body.mediaType as MediaType)
    : null;

  if (!image || !mediaType) {
    return NextResponse.json(
      { error: "Attach a ticket photo (jpeg, png, webp or gif)." },
      { status: 400 }
    );
  }
  if (image.length > MAX_BASE64_LENGTH) {
    return NextResponse.json(
      { error: "That photo is too large. Try a smaller one." },
      { status: 413 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  let text = "";
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: image },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
    text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  } catch (err) {
    const status =
      err instanceof Anthropic.APIError && typeof err.status === "number"
        ? err.status
        : null;
    if (status === 401) {
      return NextResponse.json(
        { error: "The Anthropic API key is invalid. Check ANTHROPIC_API_KEY." },
        { status: 502 }
      );
    }
    if (status === 429) {
      return NextResponse.json(
        { error: "Scanning is busy right now. Try again in a minute." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Couldn't reach the scanning service. Try again." },
      { status: 502 }
    );
  }

  // The model call happened, so the money is spent — a demo scan is consumed
  // now even if the photo turns out to be unreadable (otherwise a visitor
  // could retry unreadable images forever on our dime).
  const demoScansLeft = user
    ? null
    : Math.max(0, DEMO_SCAN_LIMIT - (demoScansUsed + 1));
  const respond = (payload: object, status: number) => {
    const res = NextResponse.json(payload, { status });
    if (!user) {
      res.cookies.set(DEMO_COOKIE, String(demoScansUsed + 1), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return res;
  };

  // The model is told to reply with bare JSON; tolerate a fenced block anyway.
  const jsonText = text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
  let extracted: Extracted;
  try {
    extracted = JSON.parse(jsonText) as Extracted;
  } catch {
    return respond(
      { error: "Couldn't read that ticket. Try a clearer photo." },
      422
    );
  }

  if (extracted.is_ticket === false) {
    return respond(
      { error: "That doesn't look like a concert ticket. Try another photo." },
      422
    );
  }

  const artist = cleanField(extracted.artist);
  const dateRaw = cleanField(extracted.date);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : "";

  if (!artist && !date) {
    return respond(
      {
        error:
          "Couldn't make out the show details. Try a sharper, well-lit photo of the whole ticket.",
      },
      422
    );
  }

  return respond(
    {
      result: {
        artist,
        venue: cleanField(extracted.venue),
        city: cleanField(extracted.city),
        country: cleanField(extracted.country),
        date,
        note: cleanField(extracted.note),
        demoScansLeft,
      },
    },
    200
  );
}
