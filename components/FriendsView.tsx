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
import type { Profile } from "@/lib/types";

function Avatar({ profile }: { profile: Profile }) {
  const letter = (profile.display_name || profile.handle || "?")
    .charAt(0)
    .toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
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
        <div className="truncate text-sm font-medium text-slate-900">
          {profile.display_name || profile.handle}
        </div>
        <div className="truncate text-xs text-slate-400">@{profile.handle}</div>
      </div>
      {right}
    </>
  );
  return href ? (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-50"
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
}: {
  myHandle: string;
  myName: string | null;
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
    <main className="min-h-dvh bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to map
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Friends</h1>
        <p className="mt-1 text-sm text-slate-500">
          You are <span className="font-medium text-slate-700">@{myHandle}</span>
          {myName ? ` · ${myName}` : ""}
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>
        )}

        {/* Add friends */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Add a friend
          </h2>
          <form onSubmit={doSearch} className="mt-3 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by @handle"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className={`${btn} shrink-0 bg-indigo-600 text-white hover:bg-indigo-700`}
            >
              {searching ? "…" : "Search"}
            </button>
          </form>

          {results && (
            <div className="mt-3 divide-y divide-slate-100">
              {results.length === 0 ? (
                <p className="py-3 text-sm text-slate-400">No one found.</p>
              ) : (
                results.map((p) => (
                  <PersonRow
                    key={p.id}
                    profile={p}
                    href={`/u/${p.handle}`}
                    right={
                      relatedIds.has(p.id) ? (
                        <span className="text-xs text-slate-400">Added</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            act(() => sendRequest(p.id));
                          }}
                          className={`${btn} bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}
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
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Requests ({graph.incoming.length})
            </h2>
            <div className="mt-2 divide-y divide-slate-100">
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
                        className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          act(() => removeFriendship(friendship.id));
                        }}
                        className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}
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
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Your friends ({graph.friends.length})
          </h2>
          {loading ? (
            <p className="py-3 text-sm text-slate-400">Loading…</p>
          ) : graph.friends.length === 0 ? (
            <p className="py-3 text-sm text-slate-500">
              No friends yet — search for someone by their @handle above.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              {graph.friends.map((p) => (
                <PersonRow
                  key={p.id}
                  profile={p}
                  href={`/u/${p.handle}`}
                  right={<span className="text-xs text-indigo-600">View →</span>}
                />
              ))}
            </div>
          )}
        </section>

        {/* Outgoing */}
        {graph.outgoing.length > 0 && (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Pending sent ({graph.outgoing.length})
            </h2>
            <div className="mt-2 divide-y divide-slate-100">
              {graph.outgoing.map(({ friendship, profile }) => (
                <PersonRow
                  key={friendship.id}
                  profile={profile}
                  right={
                    <button
                      onClick={() => act(() => removeFriendship(friendship.id))}
                      className={`${btn} border border-slate-300 text-slate-500 hover:bg-slate-50`}
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
