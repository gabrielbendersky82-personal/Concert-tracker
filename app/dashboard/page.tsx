import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeDashboard } from "@/lib/stats";
import type { Show } from "@/lib/types";
import DashboardView from "@/components/DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/welcome");

  const { data } = await supabase
    .from("shows")
    .select("*, setlist_songs(*)")
    .order("show_date", { ascending: true });

  const shows = (data ?? []) as Show[];
  const dashboard = computeDashboard(shows);

  return <DashboardView data={dashboard} handle={profile.handle} />;
}
