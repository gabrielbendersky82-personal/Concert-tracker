import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { OG_SIZE, ogCard, showStats } from "@/lib/ogCard";
import type { Profile } from "@/lib/types";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A concert map profile";

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();

  // Anon RLS only exposes public profiles; private ones get a generic card.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();

  let title = "A life in live music, mapped.";
  let stats: { value: string; label: string }[] = [];
  if (profile) {
    const name =
      (profile as Profile).display_name || `@${(profile as Profile).handle}`;
    title = `${name}'s concert map`;
    const { data: shows } = await supabase
      .from("shows")
      .select("city, show_date")
      .eq("user_id", (profile as Profile).id);
    stats = showStats(shows ?? []);
  }

  return new ImageResponse(
    ogCard({
      eyebrow: "Concert history",
      title,
      subtitle: "Shows, setlists and memories, pinned to a world map.",
      stats,
    }),
    size
  );
}
