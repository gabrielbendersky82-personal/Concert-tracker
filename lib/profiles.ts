import { createClient } from "./supabase/client";
import type { Profile } from "./types";

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function createProfile(
  handle: string,
  displayName: string
): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const clean = handle.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    throw new Error("Handle must be 3–20 characters: letters, numbers, or _.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      handle: clean,
      display_name: displayName.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("That handle is already taken.");
    throw error;
  }
  return data as Profile;
}

/** Search profiles by handle fragment (excludes yourself). */
export async function searchProfiles(query: string): Promise<Profile[]> {
  const supabase = createClient();
  const term = query.trim().toLowerCase().replace(/^@/, "");
  if (!term) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("handle", `%${term}%`)
    .limit(10);
  return ((data ?? []) as Profile[]).filter((p) => p.id !== user?.id);
}
