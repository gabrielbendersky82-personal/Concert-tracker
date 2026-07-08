"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { fetchShows, fetchShowsFor } from "@/lib/shows";
import {
  acceptRequest,
  friendStateWith,
  removeFriendship,
  sendRequest,
} from "@/lib/friends";
import { computeStats } from "@/lib/stats";
import { findMutual } from "@/lib/mutual";
import { setProfileVisibility } from "@/lib/profiles";
import AppNav from "./AppNav";
import GuestBar from "./GuestBar";
import type { FriendState, Profile, Show } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

function fmtDate(iso: string): string {
  if (/^\d{4}$/.test(iso)) return iso;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function FriendProfileView({
  profile,
  isSelf,
  myHandle,
  guest = false,
}: {
  profile: Profile;
  isSelf: boolean;
  myHandle: string | null;
  guest?: boolean;
}) {
  const [state, setState] = useState<FriendState>(isSelf ? "self" : "none");
  const [theirShows, setTheirShows] = useState<Show[]>([]);
  const [myShows, setMyShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPublic, setIsPublic] = useState(!!profile.is_public);
  const [savingVis, setSavingVis] = useState(false);
  const [copied, setCopied] = useState(false);

  const canView = isSelf || state === "accepted" || isPublic;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Logged-out visitor: RLS only returns rows for public profiles.
      if (guest) {
        setState("none");
        if (profile.is_public) setTheirShows(await fetchShowsFor(profile.id));
        return;
      }
      const s = isSelf ? "self" : await friendStateWith(profile.id);
      setState(s);
      if (s === "accepted" || s === "self" || profile.is_public) {
        const [theirs, mine] = await Promise.all([
          fetchShowsFor(profile.id),
          fetchShows(),
        ]);
        setTheirShows(theirs);
        setMyShows(mine);
      }
    } finally {
      setLoading(false);
    }
  }, [guest, isSelf, profile.id, profile.is_public]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const mutual = useMemo(
    () => (isSelf || guest ? [] : findMutual(myShows, theirShows)),
    [isSelf, guest, myShows, theirShows]
  );
  const stats = useMemo(() => computeStats(theirShows), [theirShows]);

  async function action(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility() {
    const next = !isPublic;
    setSavingVis(true);
    try {
      await setProfileVisibility(next);
      setIsPublic(next);
    } finally {
      setSavingVis(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/u/${profile.handle}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  // Find the friendship id for accept/remove actions (re-derived on demand).
  async function respond(accept: boolean) {
    const { loadFriendGraph } = await import("@/lib/friends");
    const g = await loadFriendGraph();
    const req = g.incoming.find((r) => r.profile.id === profile.id);
    if (req) {
      await (accept ? acceptRequest(req.friendship.id) : removeFriendship(req.friendship.id));
    }
  }

  const stateAction = () => {
    switch (state) {
      case "none":
        return (
          <button
            onClick={() => action(() => sendRequest(profile.id))}
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Add friend
          </button>
        );
      case "pending_outgoing":
        return <span className="text-sm text-slate-400">Request sent</span>;
      case "pending_incoming":
        return (
          <div className="flex gap-2">
            <button
              onClick={() => action(() => respond(true))}
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Accept request
            </button>
            <button
              onClick={() => action(() => respond(false))}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Decline
            </button>
          </div>
        );
      case "accepted":
        return <span className="text-sm font-medium text-emerald-600">✓ Friends</span>;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-dvh bg-slate-50">
      {guest || !myHandle ? (
        <GuestBar />
      ) : (
        <AppNav active="friends" handle={myHandle} />
      )}
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        {/* Profile header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
              {(profile.display_name || profile.handle).charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {profile.display_name || profile.handle}
              </h1>
              <p className="text-sm text-slate-400">@{profile.handle}</p>
            </div>
          </div>
          {!isSelf && !guest && stateAction()}
        </div>

        {/* Own-profile sharing controls */}
        {isSelf && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {isPublic ? "Your profile is public" : "Your profile is private"}
              </p>
              <p className="text-xs text-slate-500">
                {isPublic
                  ? "Anyone with the link can view your map — no account needed."
                  : "Only accepted friends can see your shows."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPublic && (
                <button
                  onClick={copyLink}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {copied ? "Copied!" : "Copy share link"}
                </button>
              )}
              <button
                onClick={toggleVisibility}
                disabled={savingVis}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  isPublic
                    ? "bg-slate-600 hover:bg-slate-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {savingVis
                  ? "Saving…"
                  : isPublic
                  ? "Make private"
                  : "Make public"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading…</p>
        ) : !canView ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mb-2 text-3xl" aria-hidden>
              🔒
            </div>
            <p className="font-medium text-slate-800">
              {profile.display_name || profile.handle}&apos;s shows are private
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {state === "pending_outgoing"
                ? "Once they accept your request, you'll see their map and the concerts you've both attended."
                : state === "pending_incoming"
                ? "Accept their request to compare your concert histories."
                : "Add them as a friend to see their map and find concerts you both attended."}
            </p>
          </div>
        ) : (
          <>
            {/* Mutual concerts */}
            {!isSelf && !guest && (
              <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Concerts in common ({mutual.length})
                </h2>
                {mutual.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    No shared concerts yet — as you both log more shows, matches
                    (same artist, date &amp; city) will appear here.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100">
                    {mutual.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 py-2">
                        <span className="text-lg" aria-hidden>
                          🎟️
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {s.artist}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {[s.venue, s.city].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-slate-400">
                          {fmtDate(s.show_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Their stats */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Shows", value: stats.totalShows },
                { label: "Cities", value: stats.cities },
                { label: "Countries", value: stats.countries },
                { label: "Songs seen", value: stats.totalSongs },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {k.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {k.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Their map */}
            <div className="mt-4 h-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {theirShows.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No shows on the map yet.
                </div>
              ) : (
                <MapView
                  shows={theirShows}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
