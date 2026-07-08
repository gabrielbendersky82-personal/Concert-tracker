import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FriendProfileView from "@/components/FriendProfileView";
import type { Profile } from "@/lib/types";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mine } = await supabase
    .from("profiles")
    .select("id, handle")
    .eq("id", user.id)
    .maybeSingle();
  if (!mine) redirect("/welcome");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  return (
    <FriendProfileView
      profile={profile as Profile}
      isSelf={(profile as Profile).id === user.id}
      myHandle={mine.handle}
    />
  );
}
