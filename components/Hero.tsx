import Image from "next/image";

// Landing hero shown above the map after login: a full-bleed concert photo with
// a dark scrim for legibility. Scroll (or the CTA) reveals the map/app below.
export default function Hero({
  email,
  count,
}: {
  email: string;
  count: number;
}) {
  return (
    <section className="hero-dissolve relative flex min-h-dvh flex-col overflow-hidden text-white">
      {/* Background photo */}
      <Image
        src="/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Legibility scrim + a long dissolve into the light app color below */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 45%, rgba(238,241,246,0.55) 72%, #eef1f6 100%)",
        }}
      />

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
      <div className="relative z-10 mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 pb-[20vh] text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
          Your live-music map
        </p>
        <h1
          className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.55)" }}
        >
          Every show you and your friends have ever seen, on one map.
        </h1>
        <p
          className="mt-6 max-w-xl text-pretty text-base font-semibold leading-relaxed text-white sm:text-lg"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.8)" }}
        >
          Concerts are some of the best nights of our lives — Concert Map keeps
          them all. Pin every show by venue, import setlists from setlist.fm, and
          watch your stats add up. Then connect with friends to relive the gigs
          you shared and discover where your live-music histories overlap.
        </p>

        <div className="mt-9 flex flex-col items-center gap-4">
          <a
            href="#app"
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/40 transition hover:bg-indigo-100"
          >
            {count > 0
              ? `Open your map · ${count} show${count === 1 ? "" : "s"}`
              : "Open your map"}
          </a>
          <a
            href="#app"
            className="flex items-center gap-1 text-xs font-medium text-white/70 transition hover:text-white"
            aria-label="Scroll to your map"
          >
            scroll to explore
            <span aria-hidden className="animate-bounce">
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
