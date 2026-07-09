import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMineAndFriends } from "@/lib/social";
import TimelineView from "@/components/TimelineView";

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

  const { shows, attendees, myId } = await loadMineAndFriends(supabase);

  return (
    <TimelineView
      shows={shows}
      handle={profile.handle}
      attendees={attendees}
      myId={myId ?? undefined}
    />
  );
}
