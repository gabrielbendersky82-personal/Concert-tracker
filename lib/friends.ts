import { createClient } from "./supabase/client";
import type { FriendState, Friendship, Profile } from "./types";

export interface FriendRequest {
  friendship: Friendship;
  profile: Profile;
}

export interface FriendGraph {
  friends: Profile[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export async function loadFriendGraph(): Promise<FriendGraph> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { friends: [], incoming: [], outgoing: [] };

  const { data: rows } = await supabase.from("friendships").select("*");
  const friendships = (rows ?? []) as Friendship[];

  const otherIds = new Set<string>();
  for (const f of friendships) {
    otherIds.add(f.requester === user.id ? f.addressee : f.requester);
  }

  const profiles: Record<string, Profile> = {};
  if (otherIds.size) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .in("id", [...otherIds]);
    for (const p of (profs ?? []) as Profile[]) profiles[p.id] = p;
  }

  const friends: Profile[] = [];
  const incoming: FriendRequest[] = [];
  const outgoing: FriendRequest[] = [];

  for (const f of friendships) {
    const otherId = f.requester === user.id ? f.addressee : f.requester;
    const profile = profiles[otherId];
    if (!profile) continue;
    if (f.status === "accepted") friends.push(profile);
    else if (f.addressee === user.id) incoming.push({ friendship: f, profile });
    else outgoing.push({ friendship: f, profile });
  }

  friends.sort((a, b) => a.handle.localeCompare(b.handle));
  return { friends, incoming, outgoing };
}

/** Friendship state between the current user and another user. */
export async function friendStateWith(otherId: string): Promise<FriendState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "none";
  if (user.id === otherId) return "self";

  const { data } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester.eq.${user.id},addressee.eq.${otherId}),and(requester.eq.${otherId},addressee.eq.${user.id})`
    )
    .maybeSingle();

  const f = data as Friendship | null;
  if (!f) return "none";
  if (f.status === "accepted") return "accepted";
  return f.requester === user.id ? "pending_outgoing" : "pending_incoming";
}

/** Send a request, or auto-accept if the other user already requested you. */
export async function sendRequest(targetId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (targetId === user.id) throw new Error("You can't add yourself.");

  const { data: existing } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester.eq.${user.id},addressee.eq.${targetId}),and(requester.eq.${targetId},addressee.eq.${user.id})`
    )
    .maybeSingle();

  const f = existing as Friendship | null;
  if (f) {
    if (f.status === "accepted") return;
    if (f.addressee === user.id) {
      await acceptRequest(f.id);
    }
    return; // already a pending outgoing request
  }

  const { error } = await supabase.from("friendships").insert({
    requester: user.id,
    addressee: targetId,
    status: "pending",
  });
  if (error) throw error;
}

export async function acceptRequest(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function removeFriendship(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("friendships").delete().eq("id", id);
  if (error) throw error;
}
