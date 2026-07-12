"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  acceptRequest,
  loadFriendGraph,
  removeFriendship,
  sendRequest,
  type FriendGraph,
} from "@/lib/friends";
import { searchProfiles } from "@/lib/profiles";
import type { FriendMemory, SharedNight } from "@/lib/sharedNights";
import AppNav from "./AppNav";
import type { Profile } from "@/lib/types";

function fmtDate(iso: string): string {
  if (/^\d{4}$/.test(iso)) return iso;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function friendList(friends: { label: string }[]): string {
  const names = friends.map((f) => f.label);
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function Avatar({ profile }: { profile: Profile }) {
  const letter = (profile.display_name || profile.handle || "?")
    .charAt(0)
    .toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
      {letter}
    </span>
  );
}

function PersonRow({
  profile,
  right,
  href,
}: {
  profile: Profile;
  right?: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {profile.display_name || profile.handle}
        </div>
        <div className="truncate text-xs text-ink-3">@{profile.handle}</div>
      </div>
      {right}
    </>
  );
  return href ? (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-raised"
    >
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-3 px-3 py-2">{inner}</div>
  );
}

const btn =
  "rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50";

export default function FriendsView({
  myHandle,
  myName,
  sharedNights = [],
  activity = [],
}: {
  myHandle: string;
  myName: string | null;
  sharedNights?: SharedNight[];
  activity?: FriendMemory[];
}) {
  const [graph, setGraph] = useState<FriendGraph>({
    friends: [],
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[] | null>(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const g = await loadFriendGraph();
      setGraph(g);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load friends.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function doSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await searchProfiles(query));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function act(fn: () => Promise<void>) {
    try {
      await fn();
      await load();
      if (results) setResults(await searchProfiles(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const relatedIds = new Set([
    ...graph.friends.map((f) => f.id),
    ...graph.incoming.map((r) => r.profile.id),
    ...graph.outgoing.map((r) => r.profile.id),
  ]);

  return (
    <main className="min-h-dvh bg-ground">
      <AppNav active="friends" handle={myHandle} />
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Friends</h1>
        <p className="mt-1 text-sm text-ink-2">
          You are <span className="font-medium text-ink-2">@{myHandle}</span>
          {myName ? ` · ${myName}` : ""}
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 p-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Nights you shared */}
        {sharedNights.length > 0 && (
          <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Nights you shared ({sharedNights.length})
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {sharedNights.slice(0, 12).map((n) => (
                <li key={n.showId} className="flex items-center gap-3 py-2.5">
                  <span className="text-lg" aria-hidden>
                    🎟️
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {n.artist}
                    </div>
                    <div className="truncate text-xs text-ink-2">
                      with {friendList(n.friends)}
                      {n.city ? ` · ${n.city}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-ink-3">
                    {fmtDate(n.show_date)}
                  </span>
                </li>
              ))}
            </ul>
            {sharedNights.length > 12 && (
              <p className="mt-2 text-xs text-ink-3">
                and {sharedNights.length - 12} more.
              </p>
            )}
          </section>
        )}

        {/* Friends' recent memories */}
        {activity.length > 0 && (
          <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Recently added by friends
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {activity.map((m) => (
                <li key={m.show.id} className="flex items-center gap-3 py-2.5">
                  <Avatar
                    profile={{
                      id: m.friendId,
                      handle: m.friendLabel,
                      display_name: m.friendLabel,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-ink">
                      <span className="font-medium">{m.friendLabel}</span>
                      <span className="text-ink-2"> added </span>
                      <span className="font-medium">{m.show.artist}</span>
                    </div>
                    <div className="truncate text-xs text-ink-2">
                      {[m.show.venue, m.show.city].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-ink-3">
                    {fmtDate(m.show.show_date)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Add friends */}
        <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            Add a friend
          </h2>
          <form onSubmit={doSearch} className="mt-3 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by @handle"
              className="w-full rounded-lg border border-line-2 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className={`${btn} shrink-0 bg-cta text-cta-ink hover:opacity-90`}
            >
              {searching ? "…" : "Search"}
            </button>
          </form>

          {results && (
            <div className="mt-3 divide-y divide-line">
              {results.length === 0 ? (
                <p className="py-3 text-sm text-ink-3">No one found.</p>
              ) : (
                results.map((p) => (
                  <PersonRow
                    key={p.id}
                    profile={p}
                    href={`/u/${p.handle}`}
                    right={
                      relatedIds.has(p.id) ? (
                        <span className="text-xs text-ink-3">Added</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            act(() => sendRequest(p.id));
                          }}
                          className={`${btn} bg-accent/15 text-accent hover:bg-accent/25`}
                        >
                          Add
                        </button>
                      )
                    }
                  />
                ))
              )}
            </div>
          )}
        </section>

        {/* Incoming requests */}
        {graph.incoming.length > 0 && (
          <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Requests ({graph.incoming.length})
            </h2>
            <div className="mt-2 divide-y divide-line">
              {graph.incoming.map(({ friendship, profile }) => (
                <PersonRow
                  key={friendship.id}
                  profile={profile}
                  href={`/u/${profile.handle}`}
                  right={
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          act(() => acceptRequest(friendship.id));
                        }}
                        className={`${btn} bg-cta text-cta-ink hover:opacity-90`}
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          act(() => removeFriendship(friendship.id));
                        }}
                        className={`${btn} border border-line-2 text-ink-2 hover:bg-raised`}
                      >
                        Decline
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Friends list */}
        <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            Your friends ({graph.friends.length})
          </h2>
          {loading ? (
            <p className="py-3 text-sm text-ink-3">Loading…</p>
          ) : graph.friends.length === 0 ? (
            <p className="py-3 text-sm text-ink-2">
              No friends yet — search for someone by their @handle above.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-line">
              {graph.friends.map((p) => (
                <PersonRow
                  key={p.id}
                  profile={p}
                  href={`/u/${p.handle}`}
                  right={<span className="text-xs font-medium text-accent">View →</span>}
                />
              ))}
            </div>
          )}
        </section>

        {/* Outgoing */}
        {graph.outgoing.length > 0 && (
          <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Pending sent ({graph.outgoing.length})
            </h2>
            <div className="mt-2 divide-y divide-line">
              {graph.outgoing.map(({ friendship, profile }) => (
                <PersonRow
                  key={friendship.id}
                  profile={profile}
                  right={
                    <button
                      onClick={() => act(() => removeFriendship(friendship.id))}
                      className={`${btn} border border-line-2 text-ink-2 hover:bg-raised`}
                    >
                      Cancel
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
