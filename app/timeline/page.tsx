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

  const { data } = await supabase
    .from("shows")
    .select("id, artist, venue, city, country, show_date")
    .order("show_date", { ascending: true });

  return (
    <TimelineView shows={(data ?? []) as Show[]} handle={profile.handle} />
  );
}
