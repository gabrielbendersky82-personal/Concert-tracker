"use client";

import Image from "next/image";

// Full-screen concert-photo hero. Rendered on top of the map by ScrollStage,
// which fades it out as the user scrolls (scroll-linked crossfade).
export default function Hero({
  email,
  count,
  onOpen,
}: {
  email: string;
  count: number;
  onOpen?: () => void;
}) {
  return (
    <section className="relative flex h-dvh flex-col overflow-hidden text-white">
      {/* Background photo */}
      <Image
        src="/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Legibility scrims */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/80" />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-base"
            style={{ background: "linear-gradient(150deg,#818cf8,#ec4899)" }}
          >
            📍
          </span>
          <span className="text-sm font-semibold tracking-tight">Concert Map</span>
        </div>
        <span className="hidden text-xs text-white/60 sm:block">
          Signed in as {email}
        </span>
      </div>

      {/* hero copy */}
      <div className="relative z-10 mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 pb-[8vh] text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
          Your live-music map
        </p>
        <h1
          className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.55)" }}
        >
          Every show you&apos;ve ever seen, on one map.
        </h1>
        <p
          className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}
        >
          Concert Map turns your gig history into a living map. Pin each concert
          by venue, import setlists straight from setlist.fm, and watch your
          stats add up — most-seen artists, cities and countries, and every song
          you&apos;ve heard live.
        </p>

        <div className="mt-9 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/40 transition hover:bg-indigo-100"
          >
            {count > 0
              ? `Open your map · ${count} show${count === 1 ? "" : "s"}`
              : "Open your map"}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-1 text-xs font-medium text-white/70 transition hover:text-white"
            aria-label="Scroll to your map"
          >
            scroll to explore
            <span aria-hidden className="animate-bounce">
              ↓
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
