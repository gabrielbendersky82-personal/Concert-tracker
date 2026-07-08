"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Show } from "@/lib/types";

const ITEM_W = 180;
const STRIP_H = 360;

// Decorative circle hues (not data encoding — purely for a fun, varied look).
const HUES = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

const CSS = `
.cmtl-node { opacity: 0; animation: cmtl-rise .5s ease forwards; }
.cmtl-line { transform-origin: left center; animation: cmtl-grow 1.1s ease forwards; }
@keyframes cmtl-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes cmtl-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.cmtl-capture .cmtl-node { opacity: 1 !important; animation: none !important; transform: none !important; }
.cmtl-capture .cmtl-line { animation: none !important; transform: none !important; }
@media (prefers-reduced-motion: reduce) {
  .cmtl-node { opacity: 1; animation: none; }
  .cmtl-line { animation: none; transform: none; }
}
`;

function fmtDate(iso: string): string {
  if (/^\d{4}$/.test(iso)) return iso;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function Card({ show }: { show: Show }) {
  const location =
    [show.city, show.country].filter(Boolean).join(", ") || show.venue || "—";
  return (
    <div className="w-[150px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
      <div className="truncate text-sm font-semibold text-slate-900">
        {show.artist}
      </div>
      <div className="text-xs tabular-nums text-slate-500">
        {fmtDate(show.show_date)}
      </div>
      <div className="truncate text-xs text-slate-400">{location}</div>
    </div>
  );
}

function Node({ show, index }: { show: Show; index: number }) {
  const above = index % 2 === 0;
  const hue = HUES[index % HUES.length];
  const initial = (show.artist || "?").charAt(0).toUpperCase();
  const delay = `${Math.min(index * 70, 1800)}ms`;

  return (
    <div
      className="cmtl-node relative flex shrink-0 flex-col items-center"
      style={{ width: ITEM_W, height: STRIP_H, animationDelay: delay }}
    >
      {/* above card */}
      <div className="flex flex-1 flex-col items-center justify-end pb-1">
        {above && (
          <>
            <Card show={show} />
            <div className="h-4 w-0.5 bg-slate-200" />
          </>
        )}
      </div>

      {/* dot on the line */}
      <div
        className="z-10 grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white shadow-md ring-4 ring-white"
        style={{ background: hue }}
      >
        {initial}
      </div>

      {/* below card */}
      <div className="flex flex-1 flex-col items-center justify-start pt-1">
        {!above && (
          <>
            <div className="h-4 w-0.5 bg-slate-200" />
            <Card show={show} />
          </>
        )}
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
  const years = ordered.length
    ? `${ordered[0].show_date.slice(0, 4)}–${ordered[ordered.length - 1].show_date.slice(0, 4)}`
    : "";

  async function makePng(): Promise<string | null> {
    const node = captureRef.current;
    if (!node) return null;
    setCapturing(true);
    // Let the capture class apply (freezes animations to final state).
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
        /* user cancelled share */
      }
    }
    setBusy("");
  }

  return (
    <main className="min-h-dvh bg-slate-50">
      <style>{CSS}</style>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to map
        </Link>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Your Concert Timeline
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {ordered.length
                ? `${ordered.length} show${ordered.length === 1 ? "" : "s"} · ${years}`
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
              Add or import a few shows and they&apos;ll appear here in order.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add shows
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <div
              ref={captureRef}
              className={`inline-block min-w-full p-6 ${capturing ? "cmtl-capture" : ""}`}
              style={{ background: "#ffffff" }}
            >
              <div className="mb-4 flex items-center gap-2 px-1">
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

              <div className="relative flex" style={{ height: STRIP_H }}>
                <div
                  className="cmtl-line absolute h-[3px] rounded-full"
                  style={{
                    top: STRIP_H / 2 - 1.5,
                    left: ITEM_W / 2,
                    right: ITEM_W / 2,
                    background: "linear-gradient(90deg,#818cf8,#ec4899)",
                  }}
                />
                {ordered.map((show, i) => (
                  <Node key={show.id} show={show} index={i} />
                ))}
              </div>

              <div className="mt-3 px-1 text-right text-[11px] text-slate-400">
                Made with Concert Map
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
