"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "./BrandMark";
import { computeWrapped, wrappedYears } from "@/lib/wrapped";
import type { Show } from "@/lib/types";

// Slide accent hues (cycled), matching the app's pin palette.
const HUES = ["#8d86f2", "#ec4899", "#f0b429", "#10b981", "#3b82f6"];

const CSS = `
@keyframes wr-in { from { opacity: 0; transform: translateY(26px) scale(0.985); } to { opacity: 1; transform: none; } }
.wr-slide { animation: wr-in .55s cubic-bezier(.2,.7,.2,1) both; }
.wr-d1 { animation-delay: .08s; } .wr-d2 { animation-delay: .2s; } .wr-d3 { animation-delay: .34s; }
@media (prefers-reduced-motion: reduce) { .wr-slide { animation: none; } }
`;

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

export default function WrappedStory({
  shows,
  handle,
  guest = false,
}: {
  /** One person's shows only — Wrapped is personal. */
  shows: Show[];
  handle: string;
  guest?: boolean;
}) {
  const years = useMemo(() => wrappedYears(shows), [shows]);
  const [year, setYear] = useState<string | null>(null);
  const activeYear = year ?? years[0] ?? null;
  const data = useMemo(
    () => (activeYear ? computeWrapped(shows, activeYear) : null),
    [shows, activeYear]
  );
  const [step, setStep] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const backHref = guest ? "/demo/dashboard" : "/dashboard";

  // Build the slide list for this year's data (optional slides drop out).
  const slides = useMemo<string[]>(() => {
    if (!data) return ["intro"];
    const s: string[] = ["intro", "count", "places"];
    if (data.km > 50) s.push("km");
    if (data.topArtists.length > 0) s.push("artists");
    if (data.bestNight) s.push("best");
    if (data.busiestMonth && data.count > 2) s.push("month");
    s.push("finale");
    return s;
  }, [data]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setStep((v) => Math.min(v + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setStep((v) => Math.max(v - 1, 0));
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [slides.length]);

  function go(delta: number) {
    setStep((v) => Math.max(0, Math.min(v + delta, slides.length - 1)));
  }

  async function saveCard(share: boolean) {
    const node = cardRef.current;
    if (!node) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const bg =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--ground")
          .trim() || "#0b0b0f";
      const url = await toPng(node, { backgroundColor: bg, pixelRatio: 2, cacheBust: true });
      const name = `concert-wrapped-${data?.year}.png`;
      if (share) {
        try {
          const blob = await (await fetch(url)).blob();
          const file = new File([blob], name, { type: "image/png" });
          const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
          if (nav.canShare?.({ files: [file] })) {
            await nav.share({ files: [file], title: `My ${data?.year} in live music` });
            return;
          }
        } catch {
          /* fall through to download */
        }
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
    } finally {
      setSaving(false);
    }
  }

  if (!activeYear || !data) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ground px-6 text-center">
        <div className="text-3xl" aria-hidden>🎶</div>
        <p className="font-medium text-ink">No shows to wrap yet</p>
        <p className="text-sm text-ink-2">Add a few shows and come back for your recap.</p>
        <Link href={backHref} className="mt-2 rounded-full bg-cta px-4 py-2 text-sm font-semibold text-cta-ink">
          Back
        </Link>
      </main>
    );
  }

  const kind = slides[Math.min(step, slides.length - 1)];
  const hue = HUES[step % HUES.length];

  return (
    <main className="relative flex min-h-dvh select-none flex-col overflow-hidden bg-ground">
      <style>{CSS}</style>

      {/* ambient glow tied to the slide accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 transition-[background] duration-700"
        style={{ background: `radial-gradient(60% 45% at 50% 8%, ${hue}55, transparent 70%)` }}
      />

      {/* progress + chrome */}
      <div className="relative z-20 flex items-center gap-3 px-4 pt-4">
        <div className="flex flex-1 gap-1">
          {slides.map((s, i) => (
            <span
              key={s}
              className="h-1 flex-1 overflow-hidden rounded-full bg-line"
            >
              <span
                className="block h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: i < step ? "100%" : i === step ? "60%" : "0%" }}
              />
            </span>
          ))}
        </div>
        <Link href={backHref} aria-label="Close wrapped" className="rounded-full p-1 text-ink-3 hover:text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </Link>
      </div>

      {/* tap zones */}
      <button aria-label="Previous" onClick={() => go(-1)} className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize" />
      <button aria-label="Next" onClick={() => go(1)} className="absolute inset-y-0 right-0 z-10 w-2/3 cursor-e-resize" />

      {/* slide */}
      <div key={`${activeYear}-${step}`} className="relative z-0 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        {kind === "intro" && (
          <>
            <p className="wr-slide text-xs font-bold uppercase tracking-[0.25em] text-accent">Concert Wrapped</p>
            <div className="wr-slide wr-d1 my-2 text-[88px] font-extrabold leading-none tracking-tight text-ink">
              {data.year}
            </div>
            <p className="wr-slide wr-d2 text-ink-2">
              @{handle}&apos;s year in live music
            </p>
            {years.length > 1 && (
              <div className="wr-slide wr-d3 relative z-30 mt-5 flex flex-wrap justify-center gap-1.5">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => { setYear(y); setStep(0); }}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold tabular-nums transition ${
                      y === activeYear
                        ? "border-accent text-accent"
                        : "border-line text-ink-3 hover:text-ink"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
            <p className="wr-slide wr-d3 mt-8 text-xs text-ink-3">tap to begin →</p>
          </>
        )}

        {kind === "count" && (
          <>
            <p className="wr-slide text-sm text-ink-2">You were at</p>
            <div className="wr-slide wr-d1 my-1 text-[96px] font-extrabold leading-none tabular-nums" style={{ color: hue }}>
              {data.count}
            </div>
            <p className="wr-slide wr-d2 text-lg font-bold text-ink">
              show{data.count === 1 ? "" : "s"} in {data.year}
            </p>
            <p className="wr-slide wr-d3 mt-2 text-sm text-ink-2">
              across {data.venueCount} venue{data.venueCount === 1 ? "" : "s"}
            </p>
          </>
        )}

        {kind === "places" && (
          <>
            <div className="wr-slide text-[64px] font-extrabold leading-none tabular-nums" style={{ color: hue }}>
              {data.cityNames.length}
            </div>
            <p className="wr-slide wr-d1 text-lg font-bold text-ink">
              {data.cityNames.length === 1 ? "city" : "cities"}
              {data.countryCount > 1 ? ` · ${data.countryCount} countries` : ""}
            </p>
            <p className="wr-slide wr-d2 mt-3 text-balance text-sm leading-relaxed text-ink-2">
              {data.cityNames.join(" · ")}
            </p>
          </>
        )}

        {kind === "km" && (
          <>
            <p className="wr-slide text-sm text-ink-2">You covered roughly</p>
            <div className="wr-slide wr-d1 my-1 text-[72px] font-extrabold leading-none tabular-nums" style={{ color: hue }}>
              {data.km.toLocaleString()}
            </div>
            <p className="wr-slide wr-d2 text-lg font-bold text-ink">kilometres chasing music</p>
          </>
        )}

        {kind === "artists" && (
          <>
            <p className="wr-slide text-xs font-bold uppercase tracking-[0.2em] text-ink-3">On repeat</p>
            <div className="wr-slide wr-d1 mt-4 space-y-3">
              {data.topArtists.map((a, i) => (
                <div key={a.name} className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: HUES[(step + i) % HUES.length] }}>
                    {i + 1}
                  </span>
                  <span className={`font-bold text-ink ${i === 0 ? "text-3xl" : "text-xl"}`}>{a.name}</span>
                  {a.count > 1 && (
                    <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-semibold text-ink-2">×{a.count}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {kind === "best" && data.bestNight && (
          <>
            <p className="wr-slide text-xs font-bold uppercase tracking-[0.2em] text-accent">Night of the year</p>
            <div className="wr-slide wr-d1 mt-3 text-4xl font-extrabold tracking-tight text-ink">
              {data.bestNight.artist}
            </div>
            <p className="wr-slide wr-d2 mt-2 text-sm text-ink-2">
              {[data.bestNight.venue, data.bestNight.city].filter(Boolean).join(" · ")}
              {" — "}
              {fmtDate(data.bestNight.show_date)}
            </p>
            {(data.bestNight.rating ?? 0) > 0 && (
              <div className="wr-slide wr-d2 mt-3 flex justify-center gap-1.5">
                {Array.from({ length: data.bestNight.rating! }, (_, i) => (
                  <i key={i} className="h-2.5 w-2.5 rounded-full bg-accent" />
                ))}
              </div>
            )}
            {data.bestSong && (
              <p className="wr-slide wr-d3 mt-3 text-sm font-semibold text-accent">★ {data.bestSong}</p>
            )}
          </>
        )}

        {kind === "month" && data.busiestMonth && (
          <>
            <div className="wr-slide text-5xl font-extrabold tracking-tight" style={{ color: hue }}>
              {data.busiestMonth.name}
            </div>
            <p className="wr-slide wr-d1 mt-3 text-lg font-bold text-ink">was your month</p>
            <p className="wr-slide wr-d2 mt-1 text-sm text-ink-2">
              {data.busiestMonth.count} show{data.busiestMonth.count === 1 ? "" : "s"} in {data.busiestMonth.name.toLowerCase()} alone
            </p>
          </>
        )}

        {kind === "finale" && (
          <div className="relative z-30 w-full">
            {/* the shareable card */}
            <div
              ref={cardRef}
              className="wr-slide mx-auto w-full max-w-sm rounded-2xl border border-line bg-surface p-5 text-left"
            >
              <div className="flex items-center gap-2">
                <BrandMark className="h-6 w-6" />
                <span className="text-sm font-bold text-ink">Concert Wrapped {data.year}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat label="shows" value={String(data.count)} />
                <Stat label="cities" value={String(data.cityNames.length)} />
                <Stat label="countries" value={String(data.countryCount)} />
                <Stat label="km travelled" value={data.km > 50 ? data.km.toLocaleString() : "—"} />
              </div>
              {data.topArtists[0] && (
                <p className="mt-4 text-sm text-ink-2">
                  Top artist{" "}
                  <span className="font-bold text-ink">{data.topArtists[0].name}</span>
                </p>
              )}
              {data.bestNight && (
                <p className="mt-1 text-sm text-ink-2">
                  Night of the year{" "}
                  <span className="font-bold text-ink">{data.bestNight.artist}</span>
                  {data.bestSong ? <span className="text-accent"> · ★ {data.bestSong}</span> : null}
                </p>
              )}
              <p className="mt-4 text-[10px] uppercase tracking-wider text-ink-3">
                @{handle} · my-concerts.click
              </p>
            </div>

            <div className="wr-slide wr-d1 mt-5 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => saveCard(true)}
                disabled={saving}
                className="rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-cta-ink transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Rendering…" : "Share card"}
              </button>
              <button
                onClick={() => saveCard(false)}
                disabled={saving}
                className="rounded-full border border-line-2 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-raised disabled:opacity-60"
              >
                Download
              </button>
            </div>
            {guest && (
              <p className="wr-slide wr-d2 mt-4 text-center text-xs text-ink-3">
                This is the demo&apos;s year.{" "}
                <Link href="/login" className="text-accent underline">Sign in</Link> to wrap your own.
              </p>
            )}
          </div>
        )}
      </div>

      {/* step hint */}
      <div className="relative z-0 pb-5 text-center text-[11px] text-ink-3">
        {step + 1} / {slides.length}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-raised p-3">
      <div className="text-2xl font-extrabold tabular-nums text-accent">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
    </div>
  );
}
