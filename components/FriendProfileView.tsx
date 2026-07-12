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
import { findMutual, showKey } from "@/lib/mutual";
import { setProfileVisibility } from "@/lib/profiles";
import AppNav from "./AppNav";
import GuestBar from "./GuestBar";
import ShowDetail from "./ShowDetail";
import type { FriendState, Profile, Show } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-raised text-sm text-ink-3">
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

  const mutual = useMemo(() => {
    if (isSelf || guest) return [];
    const overlap = findMutual(myShows, theirShows);
    // Also count my own shows where I tagged this friend as being there, even
    // if they haven't logged that concert themselves.
    const seen = new Set(overlap.map((s) => s.id));
    const tagged = myShows.filter(
      (s) =>
        !seen.has(s.id) &&
        (s.show_attendees ?? []).some((a) => a.friend_id === profile.id)
    );
    return [...overlap, ...tagged].sort((a, b) =>
      b.show_date.localeCompare(a.show_date)
    );
  }, [isSelf, guest, myShows, theirShows, profile.id]);
  const stats = useMemo(() => computeStats(theirShows), [theirShows]);

  // When a logged-in viewer compares with someone else, overlay both people's
  // shows on one map, colored: yours / theirs / both attended.
  const compare = !isSelf && !guest && myShows.length > 0;
  const { mapShows, colorById, mapLegend } = useMemo(() => {
    if (!compare) {
      return {
        mapShows: theirShows,
        colorById: new Map<string, string>(),
        mapLegend: undefined as { label: string; color: string }[] | undefined,
      };
    }
    const MINE = "#4f46e5";
    const THEM = "#ec4899";
    const BOTH = "#10b981";
    const mutualKeys = new Set(mutual.map(showKey));
    const colors = new Map<string, string>();
    for (const s of theirShows) {
      colors.set(s.id, mutualKeys.has(showKey(s)) ? BOTH : THEM);
    }
    const mineOnly = myShows.filter((s) => !mutualKeys.has(showKey(s)));
    for (const s of mineOnly) colors.set(s.id, MINE);
    return {
      mapShows: [...theirShows, ...mineOnly],
      colorById: colors,
      mapLegend: [
        { label: "You", color: MINE },
        { label: profile.display_name || `@${profile.handle}`, color: THEM },
        { label: "Both", color: BOTH },
      ],
    };
  }, [compare, theirShows, myShows, mutual, profile]);

  const selectedShow = useMemo(
    () => mapShows.find((s) => s.id === selectedId) ?? null,
    [mapShows, selectedId]
  );

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
            className="rounded-full bg-cta px-4 py-2 text-sm font-semibold text-cta-ink transition hover:opacity-90 disabled:opacity-60"
          >
            Add friend
          </button>
        );
      case "pending_outgoing":
        return <span className="text-sm text-ink-3">Request sent</span>;
      case "pending_incoming":
        return (
          <div className="flex gap-2">
            <button
              onClick={() => action(() => respond(true))}
              disabled={busy}
              className="rounded-full bg-cta px-4 py-2 text-sm font-semibold text-cta-ink transition hover:opacity-90 disabled:opacity-60"
            >
              Accept request
            </button>
            <button
              onClick={() => action(() => respond(false))}
              disabled={busy}
              className="rounded-lg border border-line-2 px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-raised"
            >
              Decline
            </button>
          </div>
        );
      case "accepted":
        return <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">✓ Friends</span>;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-dvh bg-ground">
      {guest || !myHandle ? (
        <GuestBar />
      ) : (
        <AppNav active="friends" handle={myHandle} />
      )}
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        {/* Profile header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo-500/15 text-lg font-semibold text-indigo-600 dark:text-indigo-300">
              {(profile.display_name || profile.handle).charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="text-xl font-bold text-ink">
                {profile.display_name || profile.handle}
              </h1>
              <p className="text-sm text-ink-3">@{profile.handle}</p>
            </div>
          </div>
          {!isSelf && !guest && stateAction()}
        </div>

        {/* Own-profile sharing controls */}
        {isSelf && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-ink">
                {isPublic ? "Your profile is public" : "Your profile is private"}
              </p>
              <p className="text-xs text-ink-2">
                {isPublic
                  ? "Anyone with the link can view your map — no account needed."
                  : "Only accepted friends can see your shows."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isPublic && (
                <button
                  onClick={copyLink}
                  className="rounded-lg border border-line-2 px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-raised"
                >
                  {copied ? "Copied!" : "Copy share link"}
                </button>
              )}
              <button
                onClick={toggleVisibility}
                disabled={savingVis}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                  isPublic
                    ? "border border-line-2 text-ink-2 hover:bg-raised"
                    : "bg-cta text-cta-ink hover:opacity-90"
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
          <p className="mt-6 text-sm text-ink-3">Loading…</p>
        ) : !canView ? (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-10 text-center">
            <div className="mb-2 text-3xl" aria-hidden>
              🔒
            </div>
            <p className="font-medium text-ink">
              {profile.display_name || profile.handle}&apos;s shows are private
            </p>
            <p className="mt-1 text-sm text-ink-2">
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
              <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                  Concerts in common ({mutual.length})
                </h2>
                {mutual.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-2">
                    No shared concerts yet — as you both log more shows, matches
                    (same artist, date &amp; city) will appear here.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-line">
                    {mutual.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 py-2">
                        <span className="text-lg" aria-hidden>
                          🎟️
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink">
                            {s.artist}
                          </div>
                          <div className="truncate text-xs text-ink-2">
                            {[s.venue, s.city].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-ink-3">
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
                <div key={k.label} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                    {k.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold tabular-nums text-ink">
                    {k.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Their map (overlays your shows too when comparing) */}
            <div className="mt-4 h-[440px] overflow-hidden rounded-2xl border border-line bg-surface">
              {mapShows.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-ink-3">
                  No shows on the map yet.
                </div>
              ) : (
                <MapView
                  shows={mapShows}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  colorOf={
                    compare ? (s) => colorById.get(s.id) ?? "#ec4899" : undefined
                  }
                  legend={mapLegend}
                />
              )}
            </div>

            {/* Detail for a clicked pin — read-only (photos, videos, setlist). */}
            {selectedShow && (
              <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
                <ShowDetail
                  show={selectedShow}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
