import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMineAndFriends } from "@/lib/social";
import { computeSharedNights, friendActivity } from "@/lib/sharedNights";
import FriendsView from "@/components/FriendsView";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/welcome");

  // Shared nights + friends' recent activity (Friends v2). Best-effort: never
  // block the friends page on this derived data.
  let sharedNights: ReturnType<typeof computeSharedNights> = [];
  let activity: ReturnType<typeof friendActivity> = [];
  try {
    const { shows, attendees, myId } = await loadMineAndFriends(supabase);
    sharedNights = computeSharedNights(shows, attendees, myId);
    activity = friendActivity(shows, attendees, myId);
  } catch {
    /* leave both empty */
  }

  return (
    <FriendsView
      myHandle={profile.handle}
      myName={profile.display_name}
      sharedNights={sharedNights}
      activity={activity}
    />
  );
}
