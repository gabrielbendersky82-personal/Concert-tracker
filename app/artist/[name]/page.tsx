import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMineAndFriends } from "@/lib/social";
import EntityView from "@/components/EntityView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Concert Map` };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
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
    <EntityView
      kind="artist"
      name={decodeURIComponent(name)}
      shows={shows}
      handle={profile.handle}
      attendees={attendees}
      myId={myId ?? undefined}
    />
  );
}
