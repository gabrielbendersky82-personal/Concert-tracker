import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TimelineView from "@/components/TimelineView";
import type { Show } from "@/lib/types";

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/welcome");

  const cols = "id, artist, venue, city, country, show_date";
  // Include photos for the card thumbnails; fall back if show_media isn't
  // present yet (migration 0004 not applied).
  const withMedia = await supabase
    .from("shows")
    .select(`${cols}, show_media(*)`)
    .eq("user_id", user.id)
    .order("show_date", { ascending: true });
  const rows = withMedia.error
    ? (
        await supabase
          .from("shows")
          .select(cols)
          .eq("user_id", user.id)
          .order("show_date", { ascending: true })
      ).data
    : withMedia.data;

  return (
    <TimelineView shows={(rows ?? []) as Show[]} handle={profile.handle} />
  );
}
