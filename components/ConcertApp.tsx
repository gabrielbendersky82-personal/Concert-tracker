"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  bulkCreateShows,
  deleteShow,
  updateFavoriteSong,
  updateShowRating,
} from "@/lib/shows";
import { addShowVideo, deleteShowMedia, uploadShowPhoto } from "@/lib/media";
import { loadMineAndFriends } from "@/lib/social";
import { matchesQuery } from "@/lib/searchShows";
import { onThisDay } from "@/lib/memories";
import { nextUpcoming, untilLabel } from "@/lib/upcoming";
import { createClient } from "@/lib/supabase/client";
import { SAMPLE_SHOWS } from "@/lib/sampleShows";
import type { Show, ShowMedia } from "@/lib/types";
import type { Attendee } from "@/lib/demoShows";
import FriendsToggle from "./FriendsToggle";
import BrandMark from "./BrandMark";
import ThemeToggle from "./ThemeToggle";
import AddShowForm from "./AddShowForm";
import StatsPanel from "./StatsPanel";
import ShowDetail from "./ShowDetail";
import ImportExport from "./ImportExport";
import { AccountMenu, BottomTabs, NavIcon, SECTIONS } from "./AppNav";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-raised text-sm text-ink-3">
      Loading map…
    </div>
  ),
});

type Tab = "add" | "shows" | "stats" | "data";

const TABS: { id: Tab; label: string }[] = [
  { id: "add", label: "Add" },
  { id: "shows", label: "Shows" },
  { id: "stats", label: "Stats" },
  { id: "data", label: "Data" },
];

// Demo (logged-out) section nav — points at the public /demo routes.
const DEMO_NAV: {
  id: "map" | "timeline" | "dashboard";
  label: string;
  href: string;
}[] = [
  { id: "map", label: "Map", href: "/demo" },
  { id: "timeline", label: "Timeline", href: "/demo/timeline" },
  { id: "dashboard", label: "Dashboard", href: "/demo/dashboard" },
];

export default function ConcertApp({
  handle,
  readOnly = false,
  initialShows,
  attendees: initialAttendees,
  myId: initialMyId,
}: {
  handle: string;
  readOnly?: boolean;
  initialShows?: Show[];
  /** Attendees (You + friends) used to color shows by whose they are. */
  attendees?: Attendee[];
  /** The current user's id (so "just me" can filter). */
  myId?: string;
}) {
  const [shows, setShows] = useState<Show[]>(initialShows ?? []);
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees ?? []);
  const [myId, setMyId] = useState<string | null>(initialMyId ?? null);
  const [showFriends, setShowFriends] = useState(true);
  const [loading, setLoading] = useState(!readOnly);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>(readOnly ? "shows" : "add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [memoryDismissed, setMemoryDismissed] = useState(false);

  const visibleTabs = readOnly
    ? TABS.filter((t) => t.id === "shows" || t.id === "stats")
    : TABS;

  const hasFriends = attendees.length > 1;
  // Show only my shows when the toggle is off; otherwise everyone's.
  const friendFiltered =
    !showFriends && myId ? shows.filter((s) => s.user_id === myId) : shows;
  // The search box narrows the map, list and stats together.
  const [query, setQuery] = useState("");
  const visibleShows = useMemo(
    () => friendFiltered.filter((s) => matchesQuery(s, query)),
    [friendFiltered, query]
  );

  // Color pins/list/legend by attendee, but only while showing friends.
  const attendeeMap = useMemo(
    () => new Map(attendees.map((a) => [a.id, a])),
    [attendees]
  );
  const colorActive = hasFriends && showFriends;
  const mapColorOf = colorActive
    ? (show: Show) => attendeeMap.get(show.user_id)?.color ?? "#e11d48"
    : undefined;
  const mapLegend = colorActive
    ? attendees.map((a) => ({ label: a.label, color: a.color }))
    : undefined;
  const attendeeOf = colorActive
    ? (show: Show) => {
        const a = attendeeMap.get(show.user_id);
        return a ? { label: a.label, color: a.color } : null;
      }
    : undefined;

  const load = useCallback(async () => {
    try {
      const data = await loadMineAndFriends(createClient());
      setShows(data.shows);
      setAttendees(data.attendees);
      setMyId(data.myId);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your shows. Is Supabase configured?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Read-only demo renders provided shows; skip the authenticated fetch.
    if (readOnly) return;
    // Fetch the user's shows on mount. State only updates after the awaited
    // fetch resolves, so this is a genuine external-sync effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, readOnly]);

  const selectedShow = useMemo(
    () => shows.find((s) => s.id === selectedId) ?? null,
    [shows, selectedId]
  );
  // Only my own shows are editable (deleting/adding media to a friend's show
  // would fail RLS). Backups also export just my shows.
  const canEditSelected =
    !readOnly && !!selectedShow && (!myId || selectedShow.user_id === myId);
  const myShows = myId ? shows.filter((s) => s.user_id === myId) : shows;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  // Reopen a show when returning from the Spotify consent redirect
  // (…/spotify/callback → back here with ?show=<id>). Runs once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const showId = params.get("show");
    if (!showId) return;
    // Reading the URL (an external system) then opening that show.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(showId);
    setSheetOpen(true);
    params.delete("show");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "")
    );
  }, []);

  async function handleCreated() {
    await load();
    setTab("shows");
  }

  async function handleDelete(id: string) {
    try {
      await deleteShow(id);
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete show.");
    }
  }

  async function handleAddPhotos(showId: string, files: File[]) {
    for (const file of files) await uploadShowPhoto(showId, file);
    await load();
  }

  async function handleAddVideo(showId: string, url: string) {
    await addShowVideo(showId, url);
    await load();
  }

  async function handleDeleteMedia(m: ShowMedia) {
    await deleteShowMedia(m);
    await load();
  }

  async function handleRate(showId: string, rating: number | null) {
    await updateShowRating(showId, rating);
    await load();
  }

  async function handleFavorite(showId: string, songId: string | null) {
    await updateFavoriteSong(showId, songId);
    await load();
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await bulkCreateShows(SAMPLE_SHOWS);
      await load();
      setTab("shows");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add samples.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="relative flex h-dvh w-full flex-col md:flex-row">
      {/* Map */}
      <div className="relative min-h-0 flex-1">
        <MapView
          shows={visibleShows}
          selectedId={selectedId}
          onSelect={handleSelect}
          colorOf={mapColorOf}
          legend={mapLegend}
        />

        {/* Light top fade so the map tiles emerge softly from the hero dissolve */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[500] h-12"
          style={{
            background: "linear-gradient(180deg, var(--ground), transparent)",
          }}
        />

        {!loading && visibleShows.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center p-6">
            <div className="pointer-events-auto max-w-xs rounded-2xl border border-line bg-surface/95 p-5 text-center shadow-lg backdrop-blur">
              <div className="mb-1 text-2xl" aria-hidden>
                🎶
              </div>
              <p className="text-sm font-medium text-ink">
                Your map is empty
              </p>
              <p className="mt-1 text-xs text-ink-2">
                Add a show, or drop in a few samples to see how it looks.
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="mt-3 rounded-full bg-cta px-3.5 py-1.5 text-xs font-semibold text-cta-ink transition hover:opacity-90 disabled:opacity-60"
              >
                {seeding ? "Adding…" : "Load sample shows"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom tab bar (sits below the sheet) */}
      {readOnly ? (
        <nav className="absolute inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur md:hidden">
          {DEMO_NAV.map((s) => {
            const on = s.id === "map";
            return (
              <Link
                key={s.id}
                href={s.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium capitalize transition ${
                  on ? "text-accent" : "text-ink-3 hover:text-ink-2"
                }`}
              >
                <NavIcon id={s.id} className="h-5 w-5" />
                {s.id}
              </Link>
            );
          })}
        </nav>
      ) : (
        <BottomTabs active="map" position="absolute" />
      )}

      {/* Sidebar / bottom sheet */}
      <aside
        className={`absolute inset-x-0 bottom-14 z-[1000] flex max-h-[78vh] flex-col rounded-t-2xl bg-surface shadow-2xl transition-transform duration-300 md:static md:bottom-0 md:h-full md:max-h-none md:w-[420px] md:translate-y-0 md:rounded-none md:border-l md:border-line md:shadow-none ${
          sheetOpen ? "translate-y-0" : "translate-y-[calc(100%-3.75rem)]"
        } md:translate-y-0`}
      >
        {/* Header (tap title to toggle on mobile) */}
        <div className="flex w-full items-center justify-between gap-2 px-4 py-3">
          <button
            onClick={() => setSheetOpen((o) => !o)}
            className="flex min-w-0 items-center gap-2 text-left md:cursor-default"
          >
            <BrandMark className="h-7 w-7" />
            <div className="min-w-0">
              <h1 className="whitespace-nowrap text-base font-extrabold leading-tight tracking-tight text-ink">
                Concert Map
              </h1>
              <p className="truncate text-xs leading-tight text-ink-3">
                {visibleShows.length} show{visibleShows.length === 1 ? "" : "s"} ·{" "}
                {readOnly ? "Live demo" : `@${handle}`}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {readOnly ? (
              <Link
                href="/login"
                className="rounded-full bg-cta px-3 py-1.5 text-xs font-semibold text-cta-ink transition hover:opacity-90"
              >
                Sign in
              </Link>
            ) : (
              <AccountMenu handle={handle} />
            )}
            <button
              onClick={() => setSheetOpen((o) => !o)}
              className="px-1 text-ink-3 md:hidden"
              aria-label="Toggle panel"
            >
              {sheetOpen ? "▾" : "▴"}
            </button>
          </div>
        </div>

        {/* Section nav — labeled links matching the top bar on the other pages */}
        <nav className="hidden items-center gap-1 border-t border-line px-3 py-2 md:flex">
          {(readOnly ? DEMO_NAV : SECTIONS).map((s) => {
            const on = s.id === "map";
            return (
              <Link
                key={s.id}
                href={s.href}
                className={`flex items-center gap-1.5 border-b-2 px-2.5 py-1.5 text-sm transition ${
                  on
                    ? "border-accent font-semibold text-ink"
                    : "border-transparent font-medium text-ink-2 hover:text-ink"
                }`}
              >
                <NavIcon id={s.id} className="h-4 w-4" />
                {s.label}
              </Link>
            );
          })}
        </nav>

        {hasFriends && (
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2">
            <span className="text-xs text-ink-2">
              {showFriends ? "You + friends" : "Just your shows"}
            </span>
            <FriendsToggle value={showFriends} onChange={setShowFriends} />
          </div>
        )}

        {shows.length > 0 && (
          <div className="relative border-t border-line px-4 py-2">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artist, venue, city, year…"
              className="w-full rounded-full border border-line bg-raised py-1.5 pl-8 pr-8 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-ink-3 transition hover:text-ink"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {(() => {
          const next = nextUpcoming(visibleShows);
          if (!next) return null;
          return (
            <button
              onClick={() => handleSelect(next.id)}
              className="flex w-full items-center gap-2 border-t border-line px-4 py-2 text-left transition hover:bg-raised"
            >
              <span className="shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                Next up
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-2">
                <span className="font-semibold text-ink">{next.artist}</span>
                {next.city ? ` · ${next.city}` : ""}
              </span>
              <span className="shrink-0 text-xs font-medium text-accent">
                {untilLabel(next.show_date)}
              </span>
            </button>
          );
        })()}

        {(() => {
          if (memoryDismissed) return null;
          // Memories only from my own history, not friends'.
          const memory = onThisDay(myId ? shows.filter((s) => s.user_id === myId) : shows);
          if (!memory) return null;
          const when =
            memory.distance === 0
              ? `On this day in ${memory.show.show_date.slice(0, 4)}`
              : `This week in ${memory.show.show_date.slice(0, 4)}`;
          return (
            <div className="flex w-full items-center gap-2 border-t border-line px-4 py-2">
              <button
                onClick={() => handleSelect(memory.show.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span aria-hidden className="shrink-0 text-sm">
                  ✨
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-ink-2">
                  <span className="font-semibold text-accent">{when}</span>
                  {" — "}
                  <span className="font-semibold text-ink">
                    {memory.show.artist}
                  </span>
                  {memory.show.venue ? ` at ${memory.show.venue}` : memory.show.city ? ` in ${memory.show.city}` : ""}
                </span>
              </button>
              <button
                onClick={() => setMemoryDismissed(true)}
                className="shrink-0 text-ink-3 transition hover:text-ink"
                aria-label="Dismiss memory"
              >
                ✕
              </button>
            </div>
          );
        })()}

        {selectedShow ? (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-line p-4">
            <ShowDetail
              show={selectedShow}
              onClose={() => setSelectedId(null)}
              onDelete={canEditSelected ? handleDelete : undefined}
              onAddPhotos={canEditSelected ? handleAddPhotos : undefined}
              onAddVideo={canEditSelected ? handleAddVideo : undefined}
              onDeleteMedia={canEditSelected ? handleDeleteMedia : undefined}
              onRate={canEditSelected ? handleRate : undefined}
              onFavorite={canEditSelected ? handleFavorite : undefined}
            />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-t border-line px-3 py-2">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setSheetOpen(true);
                  }}
                  className={`flex-1 border-b-2 px-2 py-1.5 text-sm transition ${
                    tab === t.id
                      ? "border-accent font-semibold text-ink"
                      : "border-transparent font-medium text-ink-2 hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-1">
              {error && (
                <p className="mb-3 rounded-lg bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              {tab === "add" && <AddShowForm onCreated={handleCreated} />}

              {tab === "shows" && (
                <ShowsList
                  shows={visibleShows}
                  loading={loading}
                  onSelect={handleSelect}
                  attendeeOf={attendeeOf}
                  searching={query.trim().length > 0}
                />
              )}

              {tab === "stats" && <StatsPanel shows={visibleShows} />}

              {tab === "data" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                      Backup
                    </h3>
                    <ImportExport shows={myShows} onImported={load} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                      Sample data
                    </h3>
                    <button
                      onClick={handleSeed}
                      disabled={seeding}
                      className="w-full rounded-full border border-line-2 px-3 py-2 text-sm font-medium text-ink transition hover:bg-raised disabled:opacity-60"
                    >
                      {seeding ? "Adding…" : "Load sample shows"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

type SortKey = "date" | "artist";
type SortDir = "asc" | "desc";

function ShowsList({
  shows,
  loading,
  onSelect,
  attendeeOf,
  searching = false,
}: {
  shows: Show[];
  loading: boolean;
  onSelect: (id: string) => void;
  attendeeOf?: (show: Show) => { label: string; color: string } | null;
  searching?: boolean;
}) {
  // Default: latest concerts first.
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const arr = [...shows];
    arr.sort((a, b) => {
      const r =
        sortKey === "date"
          ? a.show_date.localeCompare(b.show_date)
          : a.artist.localeCompare(b.artist, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? r : -r;
    });
    return arr;
  }, [shows, sortKey, sortDir]);

  function toggle(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Sensible starting direction per column.
      setSortDir(key === "date" ? "desc" : "asc");
    }
  }

  const arrowFor = (col: SortKey) =>
    col !== sortKey ? "↕" : sortDir === "asc" ? "↑" : "↓";

  if (loading) {
    return <p className="text-sm text-ink-3">Loading…</p>;
  }
  if (shows.length === 0) {
    return (
      <p className="text-sm text-ink-2">
        {searching
          ? "No shows match your search."
          : "No shows yet. Add one from the “Add” tab."}
      </p>
    );
  }
  return (
    <div>
      {/* Sortable column headers */}
      <div className="mb-1 flex items-center justify-between border-b border-line px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        <button
          type="button"
          onClick={() => toggle("artist")}
          className="flex items-center gap-1 transition hover:text-ink"
        >
          Concert{" "}
          <span className={sortKey === "artist" ? "" : "opacity-40"}>
            {arrowFor("artist")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => toggle("date")}
          className="flex items-center gap-1 transition hover:text-ink"
        >
          Date{" "}
          <span className={sortKey === "date" ? "" : "opacity-40"}>
            {arrowFor("date")}
          </span>
        </button>
      </div>

      <ul className="space-y-1">
        {sorted.map((show) => (
          <li key={show.id}>
            <button
              onClick={() => onSelect(show.id)}
              className="w-full rounded-lg px-2 py-2 text-left transition hover:bg-raised"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  {attendeeOf?.(show) && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: attendeeOf(show)!.color }}
                      title={attendeeOf(show)!.label}
                    />
                  )}
                  <span className="truncate font-semibold text-ink">
                    {show.artist}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-ink-3">
                  {show.show_date.slice(0, 4)}
                </span>
              </div>
              <div className="truncate text-xs text-ink-2">
                {attendeeOf?.(show) ? `${attendeeOf(show)!.label} · ` : ""}
                {[show.venue, show.city].filter(Boolean).join(" · ") || "—"}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
