"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppNav from "./AppNav";
import GuestBar from "./GuestBar";
import FriendsToggle from "./FriendsToggle";
import BrandMark from "./BrandMark";
import { firstPhotoSrc } from "@/lib/media";
import { matchesQuery } from "@/lib/searchShows";
import { isUpcoming, todayISO, untilLabel } from "@/lib/upcoming";
import type { Show } from "@/lib/types";

// Decorative card hues (not data encoding — a fun, varied look). When the
// friends view is on, the attendee color wins instead.
const HUES = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#0ea5e9",
];

// Reveal + tilt live together so the transition doesn't fight the hover
// straighten. Capture mode forces everything visible for the PNG export.
const CSS = `
.tl-reveal { opacity: 0; transform: translateY(14px) rotate(var(--tilt, 0deg)); transition: opacity .45s ease, transform .45s ease; }
.tl-reveal.is-visible { opacity: 1; transform: rotate(var(--tilt, 0deg)); }
.tl-reveal.is-visible:hover { transform: none; }
.tl-capture .tl-reveal { opacity: 1 !important; transform: rotate(var(--tilt, 0deg)) !important; }
@media (prefers-reduced-motion: reduce) {
  .tl-reveal { opacity: 1; transform: rotate(var(--tilt, 0deg)); transition: none; }
}
`;

function fmtShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function fmtFull(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

/** Square art tile: the show photo if there is one, else the artist image
 *  from Deezer, else a hue-gradient monogram. */
function ArtTile({ show, hue }: { show: Show; hue: string }) {
  const [failed, setFailed] = useState(false);
  const photo = firstPhotoSrc(show);
  const initial = (show.artist || "?").charAt(0).toUpperCase();
  return (
    <span
      className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg text-base font-extrabold text-white/90"
      style={{ background: `linear-gradient(135deg, ${hue}, ${hue}55)` }}
    >
      {initial}
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        !failed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/artist-image?name=${encodeURIComponent(show.artist)}`}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      )}
    </span>
  );
}

/** Compact list-row card — the dense unit of the stack. */
function CompactCard({
  show,
  hue,
  tilt,
  until,
}: {
  show: Show;
  hue: string;
  tilt: number;
  until?: string;
}) {
  const meta = [show.venue, show.city].filter(Boolean).join(" · ");
  return (
    <article
      className="tl-reveal mb-2.5 flex break-inside-avoid items-center gap-2.5 rounded-xl border border-line bg-surface p-2 shadow-sm transition hover:border-[var(--hue)]"
      style={
        {
          "--tilt": `${tilt}deg`,
          "--hue": hue,
        } as React.CSSProperties
      }
    >
      <ArtTile show={show} hue={hue} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-bold leading-tight text-ink">
          {show.artist}
        </div>
        <div className="truncate text-[11.5px] text-ink-2">
          {meta}
          {meta ? " · " : ""}
          <span className="tabular-nums text-ink-3">
            {fmtShort(show.show_date)}
          </span>
          {until && (
            <span className="ml-1.5 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
              {until}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/** Full-width banner card for 5-star nights — the stack's grid-breaker. */
function HeroCard({ show, hue }: { show: Show; hue: string }) {
  const photo = firstPhotoSrc(show);
  const meta = [show.venue, show.city].filter(Boolean).join(" · ");
  const favorite = show.favorite_song_id
    ? show.setlist_songs.find((s) => s.id === show.favorite_song_id)
    : null;
  return (
    <article className="tl-reveal mb-3 overflow-hidden rounded-xl border border-line bg-surface shadow-md">
      <div
        className="relative flex h-24 items-end px-3.5 pb-2.5 sm:h-28"
        style={{ background: `linear-gradient(135deg, ${hue}, ${hue}55)` }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.72))",
          }}
        />
        <h3
          className="relative z-10 text-lg font-extrabold tracking-tight text-white sm:text-xl"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}
        >
          {show.artist}
        </h3>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3.5 py-2">
        <span className="min-w-0 truncate text-xs text-ink-2">
          {meta}
          {meta ? " · " : ""}
          <span className="tabular-nums text-ink-3">
            {fmtFull(show.show_date)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {Array.from({ length: show.rating ?? 0 }, (_, i) => (
            <i key={i} className="h-1.5 w-1.5 rounded-full bg-accent" />
          ))}
          <span className="ml-1 truncate text-[10px] font-bold text-accent">
            {favorite ? `★ ${favorite.title}` : "song of the night ★"}
          </span>
        </span>
      </div>
    </article>
  );
}

function YearHeader({
  year,
  count,
  upcoming = false,
}: {
  year: string;
  count: number;
  upcoming?: boolean;
}) {
  return (
    <div className="tl-reveal relative flex items-baseline gap-2.5 pb-2.5 pt-6">
      <span
        className={`absolute -left-[26px] top-1/2 h-[11px] w-[11px] rounded-full ring-4 ring-ground ${
          upcoming ? "border border-dashed border-accent bg-surface" : "bg-accent"
        }`}
      />
      <b className="text-[28px] font-extrabold leading-none tracking-tight text-ink sm:text-[32px]">
        {year}
      </b>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
        {count} show{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export default function TimelineView({
  shows,
  handle,
  guest = false,
  attendees,
  myId,
}: {
  shows: Show[];
  handle: string;
  guest?: boolean;
  /** When set, nodes/cards are colored by attendee (show.user_id → persona). */
  attendees?: { id: string; label: string; color: string }[];
  /** The current user's id (so "just me" can filter). */
  myId?: string;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [busy, setBusy] = useState<"" | "export" | "share">("");
  const [showFriends, setShowFriends] = useState(true);
  const [spot, setSpot] = useState<{ year: string; count: number } | null>(
    null
  );

  const hasFriends = !!attendees && attendees.length > 1;
  const colorActive = hasFriends && showFriends;
  const attendeeColor = colorActive
    ? (show: Show) =>
        attendees!.find((a) => a.id === show.user_id)?.color ?? null
    : () => null;

  const [query, setQuery] = useState("");
  const friendFiltered =
    !showFriends && myId ? shows.filter((s) => s.user_id === myId) : shows;
  const visibleShows = friendFiltered.filter((s) => matchesQuery(s, query));
  const ordered = [...visibleShows].sort((a, b) =>
    a.show_date.localeCompare(b.show_date)
  );

  // Group by year.
  const groups: { year: string; shows: Show[] }[] = [];
  for (const s of ordered) {
    const year = s.show_date.slice(0, 4) || "—";
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.shows.push(s);
    else groups.push({ year, shows: [s] });
  }

  const yearsLabel = ordered.length
    ? `${ordered[0].show_date.slice(0, 4)}–${ordered[ordered.length - 1].show_date.slice(0, 4)}`
    : "";

  // Scroll-reveal via a single IntersectionObserver (scales to hundreds).
  useEffect(() => {
    const root = captureRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    root.querySelectorAll(".tl-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ordered.length, showFriends, query]);

  // Floating "where am I" chip: track which year block is in view.
  useEffect(() => {
    const root = captureRef.current;
    if (!root) return;
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            setSpot({
              year: el.dataset.tlYear ?? "",
              count: Number(el.dataset.tlCount ?? 0),
            });
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    root.querySelectorAll("[data-tl-year]").forEach((el) => spy.observe(el));
    return () => spy.disconnect();
  }, [ordered.length, showFriends, query]);

  async function makePng(): Promise<string | null> {
    const node = captureRef.current;
    if (!node) return null;
    setCapturing(true);
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r(null)))
    );
    try {
      const { toPng } = await import("html-to-image");
      // Match the on-screen theme so dark exports aren't white-framed.
      const bg =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--ground")
          .trim() || "#ffffff";
      return await toPng(node, {
        backgroundColor: bg,
        pixelRatio: 2,
        cacheBust: true,
      });
    } catch {
      return null;
    } finally {
      setCapturing(false);
    }
  }

  async function handleExport() {
    setBusy("export");
    const url = await makePng();
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "concert-timeline.png";
      a.click();
    }
    setBusy("");
  }

  async function handleShare() {
    setBusy("share");
    const url = await makePng();
    if (url) {
      try {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], "concert-timeline.png", {
          type: "image/png",
        });
        const nav = navigator as Navigator & {
          canShare?: (d: ShareData) => boolean;
        };
        if (nav.canShare?.({ files: [file] })) {
          await nav.share({ files: [file], title: "My Concert Timeline" });
        } else {
          const a = document.createElement("a");
          a.href = url;
          a.download = "concert-timeline.png";
          a.click();
        }
      } catch {
        /* cancelled */
      }
    }
    setBusy("");
  }

  // Build year sections: 5-star heroes lead each year, the rest pack tight.
  // Future shows sit in their own "Coming up" block at the chronological end.
  const today = todayISO();
  const orderIndex = new Map(ordered.map((s, i) => [s.id, i]));
  const hueOf = (s: Show) =>
    attendeeColor(s) ?? HUES[(orderIndex.get(s.id) ?? 0) % HUES.length];
  const tiltOf = (s: Show) =>
    ((((orderIndex.get(s.id) ?? 0) * 7) % 5) - 2) * 0.6;

  const sections: React.ReactNode[] = [];
  for (const g of groups) {
    const past = g.shows.filter((s) => !isUpcoming(s, today));
    if (past.length === 0) continue;
    const heroes = past.filter((s) => s.rating === 5);
    const rest = past.filter((s) => s.rating !== 5);
    sections.push(
      <section key={g.year} data-tl-year={g.year} data-tl-count={past.length}>
        <YearHeader year={g.year} count={past.length} />
        {heroes.map((s) => (
          <HeroCard key={s.id} show={s} hue={hueOf(s)} />
        ))}
        {rest.length > 0 && (
          <div className="columns-1 gap-x-2.5 sm:columns-2">
            {rest.map((s) => (
              <CompactCard key={s.id} show={s} hue={hueOf(s)} tilt={tiltOf(s)} />
            ))}
          </div>
        )}
      </section>
    );
  }
  const future = ordered.filter((s) => isUpcoming(s, today));
  if (future.length > 0) {
    sections.push(
      <section
        key="coming-up"
        data-tl-year="Coming up"
        data-tl-count={future.length}
      >
        <YearHeader year="Coming up" count={future.length} upcoming />
        <div className="columns-1 gap-x-2.5 sm:columns-2">
          {future.map((s) => (
            <CompactCard
              key={s.id}
              show={s}
              hue={hueOf(s)}
              tilt={tiltOf(s)}
              until={untilLabel(s.show_date, today)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-dvh bg-ground">
      <style>{CSS}</style>
      {guest ? (
        <GuestBar
          active="timeline"
          showSections
          notice="You're exploring a live demo — sign in to build your own."
        />
      ) : (
        <AppNav active="timeline" handle={handle} />
      )}

      {/* Floating "current year" chip — wayfinding while scrolling long runs */}
      {spot && !capturing && ordered.length > 6 && (
        <div className="pointer-events-none fixed right-4 top-20 z-30 flex items-baseline gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1.5 shadow-lg backdrop-blur">
          <b className="text-sm font-extrabold tabular-nums text-ink">
            {spot.year}
          </b>
          <span className="text-[10px] font-semibold text-ink-3">
            {spot.count} show{spot.count === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 md:pb-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Your Concert Timeline
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              {ordered.length
                ? `${ordered.length} show${ordered.length === 1 ? "" : "s"} · ${yearsLabel}`
                : "No shows yet."}
            </p>
            {colorActive && ordered.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {attendees!.map((a) => (
                  <span
                    key={a.id}
                    className="flex items-center gap-1.5 text-xs font-medium text-ink-2"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: a.color }}
                    />
                    {a.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(shows.length > 0 || query) && (
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shows…"
                className="w-40 rounded-full border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none sm:w-48"
              />
            )}
            {hasFriends && (
              <FriendsToggle value={showFriends} onChange={setShowFriends} />
            )}
            {ordered.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  disabled={!!busy}
                  className="rounded-lg border border-line-2 px-4 py-2 text-sm font-medium text-ink-2 transition hover:bg-raised disabled:opacity-50"
                >
                  {busy === "export" ? "Rendering…" : "Export image"}
                </button>
                <button
                  onClick={handleShare}
                  disabled={!!busy}
                  className="rounded-full bg-cta px-4 py-2 text-sm font-semibold text-cta-ink transition hover:opacity-90 disabled:opacity-50"
                >
                  {busy === "share" ? "Rendering…" : "Share"}
                </button>
              </>
            )}
          </div>
        </div>

        {ordered.length === 0 && query.trim() ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-medium text-ink">No shows match your search</p>
            <button
              onClick={() => setQuery("")}
              className="mt-3 rounded-full border border-line-2 px-4 py-2 text-sm font-medium text-ink transition hover:bg-raised"
            >
              Clear search
            </button>
          </div>
        ) : ordered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center">
            <div className="mb-2 text-3xl" aria-hidden>
              🎶
            </div>
            <p className="font-medium text-ink">Your timeline is empty</p>
            <p className="mt-1 text-sm text-ink-2">
              Add or import a few shows and they&apos;ll appear here by year.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-cta px-4 py-2 text-sm font-semibold text-cta-ink transition hover:opacity-90"
            >
              Add shows
            </Link>
          </div>
        ) : (
          <div
            ref={captureRef}
            className={`rounded-2xl border border-line bg-ground p-4 sm:p-6 ${
              capturing ? "tl-capture" : ""
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              <BrandMark className="h-7 w-7" />
              <span className="text-sm font-semibold text-ink-2">
                @{handle}&apos;s concert timeline
              </span>
            </div>

            {/* The spine: a dashed rail every year block hangs from */}
            <div className="relative ml-1.5 border-l border-dashed border-line pl-6 sm:ml-2.5 sm:pl-8">
              {sections}
            </div>

            <div className="mt-4 text-right text-[11px] text-ink-3">
              Made with Concert Map
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
