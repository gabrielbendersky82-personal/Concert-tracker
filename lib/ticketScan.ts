// Client-side half of the ticket scanner: shrink the photo in the browser,
// then let the server route read it. Downscaling keeps requests small (phone
// photos are 5–12 MB; Vercel caps bodies at ~4.5 MB) and scans cheap — ticket
// text is perfectly legible at 1600px.

export interface TicketScanResult {
  artist: string;
  venue: string;
  city: string;
  country: string;
  date: string; // YYYY-MM-DD or ""
  note: string;
}

const MAX_EDGE = 1600;
// Only if re-encoding fails: the raw file is acceptable when it's small and a
// type the API understands.
const MAX_RAW_BYTES = 3 * 1024 * 1024;
const RAW_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function prepareImage(
  file: File
): Promise<{ image: string; mediaType: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { image: dataUrl.slice(dataUrl.indexOf(",") + 1), mediaType: "image/jpeg" };
  } catch {
    // Couldn't decode/re-encode (odd format, huge image) — fall back to the
    // original file when it's already small and API-compatible.
    if (RAW_TYPES.includes(file.type) && file.size <= MAX_RAW_BYTES) {
      return { image: await fileToBase64(file), mediaType: file.type };
    }
    throw new Error("Couldn't read that image. Try a JPEG or PNG photo.");
  }
}

/** Send a ticket photo to the scanner and get back prefill-ready show details. */
export async function scanTicket(file: File): Promise<TicketScanResult> {
  const payload = await prepareImage(file);

  const res = await fetch("/api/ticket-scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    result?: TicketScanResult;
    error?: string;
  };
  if (!res.ok || !data.result) {
    throw new Error(data.error ?? "Couldn't scan that ticket. Try again.");
  }
  return data.result;
}
