import { createClient } from "./supabase/client";
import type { ShowMedia } from "./types";

const BUCKET = "concert-photos";

/** Extract an 11-char YouTube id from a URL or bare id; null if not found. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*\bv=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|live)\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Public URL for a stored photo path. */
export function photoPublicUrl(path: string): string {
  const supabase = createClient();
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Resolve a media item to a displayable image/thumbnail URL. */
export function mediaSrc(m: ShowMedia): string {
  if (m.kind === "video" && m.youtube_id) {
    return `https://i.ytimg.com/vi/${m.youtube_id}/hqdefault.jpg`;
  }
  if (m.url) return m.url;
  if (m.storage_path) return photoPublicUrl(m.storage_path);
  return "";
}

function fileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "jpg";
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : "jpg";
}

/** Upload one photo for a show and record it. */
export async function uploadShowPhoto(
  showId: string,
  file: File
): Promise<ShowMedia> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const path = `${user.id}/${showId}/${crypto.randomUUID()}.${fileExt(file.name)}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("show_media")
    .insert({ show_id: showId, kind: "photo", storage_path: path })
    .select()
    .single();
  if (error) {
    // Roll back the orphaned object if the row insert fails.
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data as ShowMedia;
}

/** Attach a YouTube video to a show. */
export async function addShowVideo(
  showId: string,
  urlOrId: string,
  caption?: string
): Promise<ShowMedia> {
  const youtube_id = parseYouTubeId(urlOrId);
  if (!youtube_id) throw new Error("That doesn't look like a YouTube link.");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("show_media")
    .insert({
      show_id: showId,
      kind: "video",
      youtube_id,
      caption: caption?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ShowMedia;
}

/** Delete a media item (and its stored file, if a photo). */
export async function deleteShowMedia(m: ShowMedia): Promise<void> {
  const supabase = createClient();
  if (m.kind === "photo" && m.storage_path) {
    await supabase.storage.from(BUCKET).remove([m.storage_path]);
  }
  const { error } = await supabase.from("show_media").delete().eq("id", m.id);
  if (error) throw error;
}
