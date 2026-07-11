import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMineAndFriends } from "@/lib/social";
import WrappedStory from "@/components/WrappedStory";

export const metadata: Metadata = {
  title: "Concert Wrapped",
  description: "Your year in live music, wrapped.",
};

export default async function WrappedPage() {
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

  // Wrapped is personal: only the signed-in user's own shows.
  const { shows, myId } = await loadMineAndFriends(supabase);
  const mine = myId ? shows.filter((s) => s.user_id === myId) : shows;

  return <WrappedStory shows={mine} handle={profile.handle} />;
}
