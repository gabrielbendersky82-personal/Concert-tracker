"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { bulkCreateShows, deleteShow, fetchShows } from "@/lib/shows";
import { addShowVideo, deleteShowMedia, uploadShowPhoto } from "@/lib/media";
import { SAMPLE_SHOWS } from "@/lib/sampleShows";
import type { Show, ShowMedia } from "@/lib/types";
import AddShowForm from "./AddShowForm";
import StatsPanel from "./StatsPanel";
import ShowDetail from "./ShowDetail";
import ImportExport from "./ImportExport";
import { AccountMenu, BottomTabs, NavIcon, SECTIONS } from "./AppNav";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
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
const DEMO_NAV: { id: "map" | "timeline" | "dashboard"; href: string }[] = [
  { id: "map", href: "/demo" },
  { id: "timeline", href: "/demo/timeline" },
  { id: "dashboard", href: "/demo/dashboard" },
];

export default function ConcertApp({
  handle,
  readOnly = false,
  initialShows,
  attendees,
}: {
  handle: string;
  readOnly?: boolean;
  initialShows?: Show[];
  /** When set, pins/list are colored by attendee (show.user_id → persona). */
  attendees?: { id: string; label: string; color: string }[];
}) {
  // Derive the coloring helpers from the (serializable) attendee list.
  const attendeeMap = useMemo(
    () => new Map((attendees ?? []).map((a) => [a.id, a])),
    [attendees]
  );
  const mapColorOf = attendees
    ? (show: Show) => attendeeMap.get(show.user_id)?.color ?? "#e11d48"
    : undefined;
  const mapLegend = attendees?.map((a) => ({ label: a.label, color: a.color }));
  const attendeeOf = attendees
    ? (show: Show) => {
        const a = attendeeMap.get(show.user_id);
        return a ? { label: a.label, color: a.color } : null;
      }
    : undefined;
  const [shows, setShows] = useState<Show[]>(initialShows ?? []);
  const [loading, setLoading] = useState(!readOnly);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>(readOnly ? "shows" : "add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const visibleTabs = readOnly
    ? TABS.filter((t) => t.id === "shows" || t.id === "stats")
    : TABS;

  const load = useCallback(async () => {
    try {
      const data = await fetchShows();
      setShows(data);
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

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
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
          shows={shows}
          selectedId={selectedId}
          onSelect={handleSelect}
          colorOf={mapColorOf}
          legend={mapLegend}
        />

        {/* Light top fade so the map tiles emerge softly from the hero dissolve */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[500] h-24"
          style={{
            background:
              "linear-gradient(180deg, #eef1f6, rgba(238,241,246,0))",
          }}
        />

        {!loading && shows.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center p-6">
            <div className="pointer-events-auto max-w-xs rounded-2xl bg-white/95 p-5 text-center shadow-lg backdrop-blur">
              <div className="mb-1 text-2xl" aria-hidden>
                🎶
              </div>
              <p className="text-sm font-medium text-slate-800">
                Your map is empty
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add a show, or drop in a few samples to see how it looks.
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {seeding ? "Adding…" : "Load sample shows"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom tab bar (sits below the sheet) */}
      {readOnly ? (
        <nav className="absolute inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
          {DEMO_NAV.map((s) => {
            const on = s.id === "map";
            return (
              <Link
                key={s.id}
                href={s.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium capitalize transition ${
                  on ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
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
        className={`absolute inset-x-0 bottom-14 z-[1000] flex max-h-[78vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 md:static md:bottom-0 md:h-full md:max-h-none md:w-[380px] md:translate-y-0 md:rounded-none md:border-l md:border-slate-200 md:shadow-none ${
          sheetOpen ? "translate-y-0" : "translate-y-[calc(100%-3.75rem)]"
        } md:translate-y-0`}
      >
        {/* Header (tap title to toggle on mobile) */}
        <div className="flex w-full items-center justify-between gap-2 px-4 py-3">
          <button
            onClick={() => setSheetOpen((o) => !o)}
            className="flex min-w-0 items-center gap-2 text-left md:cursor-default"
          >
            <span className="text-lg" aria-hidden>
              📍
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight text-slate-900">
                Concert Map
              </h1>
              <p className="truncate text-xs leading-tight text-slate-400">
                {shows.length} show{shows.length === 1 ? "" : "s"} ·{" "}
                {readOnly ? "Live demo" : `@${handle}`}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-0.5 md:flex">
              {(readOnly ? DEMO_NAV : SECTIONS).map((s) => {
                const on = s.id === "map";
                return (
                  <Link
                    key={s.id}
                    href={s.href}
                    title={s.id}
                    className={`grid h-8 w-8 place-items-center rounded-lg transition ${
                      on
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <NavIcon id={s.id} className="h-[18px] w-[18px]" />
                  </Link>
                );
              })}
            </nav>
            {readOnly ? (
              <Link
                href="/login"
                className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Sign in
              </Link>
            ) : (
              <AccountMenu handle={handle} />
            )}
            <button
              onClick={() => setSheetOpen((o) => !o)}
              className="px-1 text-slate-400 md:hidden"
              aria-label="Toggle panel"
            >
              {sheetOpen ? "▾" : "▴"}
            </button>
          </div>
        </div>

        {selectedShow ? (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-100 p-4">
            <ShowDetail
              show={selectedShow}
              onClose={() => setSelectedId(null)}
              onDelete={readOnly ? undefined : handleDelete}
              onAddPhotos={readOnly ? undefined : handleAddPhotos}
              onAddVideo={readOnly ? undefined : handleAddVideo}
              onDeleteMedia={readOnly ? undefined : handleDeleteMedia}
            />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-t border-slate-100 px-3 py-2">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setSheetOpen(true);
                  }}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                    tab === t.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-1">
              {error && (
                <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              {tab === "add" && <AddShowForm onCreated={handleCreated} />}

              {tab === "shows" && (
                <ShowsList
                  shows={shows}
                  loading={loading}
                  onSelect={handleSelect}
                  attendeeOf={attendeeOf}
                />
              )}

              {tab === "stats" && <StatsPanel shows={shows} />}

              {tab === "data" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Backup
                    </h3>
                    <ImportExport shows={shows} onImported={load} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Sample data
                    </h3>
                    <button
                      onClick={handleSeed}
                      disabled={seeding}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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

function ShowsList({
  shows,
  loading,
  onSelect,
  attendeeOf,
}: {
  shows: Show[];
  loading: boolean;
  onSelect: (id: string) => void;
  attendeeOf?: (show: Show) => { label: string; color: string } | null;
}) {
  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }
  if (shows.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No shows yet. Add one from the “Add” tab.
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {shows.map((show) => (
        <li key={show.id}>
          <button
            onClick={() => onSelect(show.id)}
            className="w-full rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
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
                <span className="truncate font-medium text-slate-800">
                  {show.artist}
                </span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-slate-400">
                {show.show_date.slice(0, 4)}
              </span>
            </div>
            <div className="truncate text-xs text-slate-500">
              {attendeeOf?.(show) ? `${attendeeOf(show)!.label} · ` : ""}
              {[show.venue, show.city].filter(Boolean).join(" · ") || "—"}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
