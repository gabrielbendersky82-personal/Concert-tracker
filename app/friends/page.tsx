import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  return <FriendsView myHandle={profile.handle} myName={profile.display_name} />;
}
