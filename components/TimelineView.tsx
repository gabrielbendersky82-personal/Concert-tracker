"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppNav from "./AppNav";
import type { Show } from "@/lib/types";

// Decorative circle hues (not data encoding — a fun, varied look).
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

const CSS = `
.tl-reveal { opacity: 0; transform: translateY(18px); transition: opacity .5s ease, transform .5s ease; }
.tl-reveal.is-visible { opacity: 1; transform: none; }
.tl-capture .tl-reveal { opacity: 1 !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) {
  .tl-reveal { opacity: 1; transform: none; transition: none; }
}
`;

function fmtDate(iso: string): string {
  if (/^\d{4}$/.test(iso)) return iso;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function PinGlyph() {
  return (
    <svg
      className="h-3 w-3 shrink-0 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21s-6-5.4-6-10a6 6 0 1112 0c0 4.6-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

function ShowCard({ show, hue }: { show: Show; hue: string }) {
  const location =
    [show.city, show.country].filter(Boolean).join(", ") || show.venue || "—";
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: hue }} />
      <div className="py-2.5 pl-4 pr-3">
        <div className="truncate text-sm font-semibold text-slate-900">
          {show.artist}
        </div>
        <div className="text-xs tabular-nums text-slate-500">
          {fmtDate(show.show_date)}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
          <PinGlyph />
          <span className="truncate">{location}</span>
        </div>
      </div>
    </div>
  );
}

function YearMarker({ year, count }: { year: string; count: number }) {
  return (
    <div className="tl-reveal relative my-7 flex pl-3 md:justify-center md:pl-0">
      <span className="rounded-full bg-gradient-to-r from-indigo-600 to-pink-500 px-4 py-1.5 text-sm font-bold text-white shadow-md">
        {year} · {count} show{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function Row({
  show,
  hue,
  side,
}: {
  show: Show;
  hue: string;
  side: boolean; // true = right (desktop)
}) {
  const initial = (show.artist || "?").charAt(0).toUpperCase();
  return (
    <div className="tl-reveal relative mb-5 pl-12 md:pl-0">
      <span
        className="absolute left-[22px] top-3 z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full text-xs font-bold text-white shadow ring-4 ring-slate-50 md:left-1/2"
        style={{ background: hue }}
      >
        {initial}
      </span>
      <div className={`md:w-[calc(50%-1.75rem)] ${side ? "md:ml-auto" : ""}`}>
        <ShowCard show={show} hue={hue} />
      </div>
    </div>
  );
}

export default function TimelineView({
  shows,
  handle,
}: {
  shows: Show[];
  handle: string;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [busy, setBusy] = useState<"" | "export" | "share">("");

  const ordered = [...shows].sort((a, b) =>
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
  }, [shows.length]);

  async function makePng(): Promise<string | null> {
    const node = captureRef.current;
    if (!node) return null;
    setCapturing(true);
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r(null)))
    );
    try {
      const { toPng } = await import("html-to-image");
      return await toPng(node, {
        backgroundColor: "#ffffff",
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

  // Build the interleaved marker + row list with a running hue/side index.
  let gi = 0;
  const items: React.ReactNode[] = [];
  for (const g of groups) {
    items.push(<YearMarker key={`y-${g.year}`} year={g.year} count={g.shows.length} />);
    for (const s of g.shows) {
      items.push(
        <Row key={s.id} show={s} hue={HUES[gi % HUES.length]} side={gi % 2 === 1} />
      );
      gi += 1;
    }
  }

  return (
    <main className="min-h-dvh bg-slate-50">
      <style>{CSS}</style>
      <AppNav active="timeline" handle={handle} />
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 md:pb-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Your Concert Timeline
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {ordered.length
                ? `${ordered.length} show${ordered.length === 1 ? "" : "s"} · ${yearsLabel}`
                : "No shows yet."}
            </p>
          </div>
          {ordered.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={!!busy}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {busy === "export" ? "Rendering…" : "Export image"}
              </button>
              <button
                onClick={handleShare}
                disabled={!!busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy === "share" ? "Rendering…" : "Share"}
              </button>
            </div>
          )}
        </div>

        {ordered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mb-2 text-3xl" aria-hidden>
              🎶
            </div>
            <p className="font-medium text-slate-800">Your timeline is empty</p>
            <p className="mt-1 text-sm text-slate-500">
              Add or import a few shows and they&apos;ll appear here by year.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add shows
            </Link>
          </div>
        ) : (
          <div
            ref={captureRef}
            className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${
              capturing ? "tl-capture" : ""
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="grid h-7 w-7 place-items-center rounded-lg text-sm"
                style={{ background: "linear-gradient(150deg,#818cf8,#ec4899)" }}
              >
                📍
              </span>
              <span className="text-sm font-semibold text-slate-700">
                @{handle}&apos;s concert timeline
              </span>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute bottom-3 top-3 left-[22px] w-[3px] -translate-x-1/2 rounded-full md:left-1/2"
                style={{ background: "linear-gradient(180deg,#6366f1,#ec4899)" }}
              />
              {items}
            </div>

            <div className="mt-4 text-right text-[11px] text-slate-400">
              Made with Concert Map
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
