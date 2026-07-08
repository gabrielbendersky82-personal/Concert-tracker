import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FriendProfileView from "@/components/FriendProfileView";
import type { Profile } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  if (!profile) return { title: "Concert Map" };
  const name = (profile as Profile).display_name || `@${profile.handle}`;
  return {
    title: `${name}'s concerts · Concert Map`,
    description: `See the shows ${name} has been to, mapped.`,
  };
}

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

  // Logged-in viewers must have their own profile (same gate as before).
  // Logged-out visitors are allowed through — RLS decides what they can read.
  let myHandle: string | null = null;
  if (user) {
    const { data: mine } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .maybeSingle();
    if (!mine) redirect("/welcome");
    myHandle = mine.handle;
  }

  // Anon can only read the row when it's public; a private profile therefore
  // 404s for logged-out visitors, which is the intended behaviour.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();

  return (
    <FriendProfileView
      profile={profile as Profile}
      isSelf={!!user && (profile as Profile).id === user.id}
      myHandle={myHandle}
      guest={!user}
    />
  );
}
