// Landing hero shown above the map after login. Deliberately dark — a night
// festival — in both themes. Scroll (or the CTA) reveals the map/app below.

function seeded(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// A packed crowd silhouette generated deterministically (no hydration drift).
function Crowd() {
  const front = Array.from({ length: 30 }, (_, i) => {
    const cx = (i / 29) * 1200 + (seeded(i + 50) - 0.5) * 22;
    const raised = seeded(i + 100) > 0.5;
    const headY = 214 - seeded(i) * 10;
    return { cx, raised, headY };
  });
  const back = Array.from({ length: 40 }, (_, i) => ({
    cx: (i / 39) * 1200 + (seeded(i + 7) - 0.5) * 26,
    cy: 224 - seeded(i + 3) * 8,
    r: 6 + seeded(i + 11) * 3,
  }));
  const lights = Array.from({ length: 16 }, (_, i) => ({
    x: 45 + i * 74 + (seeded(i + 200) - 0.5) * 50,
    y: 200 - seeded(i + 210) * 26,
    r: 1.7 + seeded(i + 220) * 1.8,
  }));

  return (
    <svg
      className="pointer-events-none absolute bottom-0 left-0 h-[46vh] w-full"
      viewBox="0 0 1200 260"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {/* phone / lighter lights floating above the crowd */}
      {lights.map((l, i) => (
        <g key={`l${i}`}>
          <circle cx={l.x} cy={l.y} r={l.r * 3} fill="#fde68a" opacity="0.12" />
          <circle cx={l.x} cy={l.y} r={l.r} fill="#fef3c7" opacity="0.95" />
        </g>
      ))}
      {/* far crowd */}
      {back.map((b, i) => (
        <circle key={`b${i}`} cx={b.cx} cy={b.cy} r={b.r} fill="#2a2450" />
      ))}
      {/* packed bodies */}
      <rect x="0" y="230" width="1200" height="40" fill="#0a0817" />
      {/* front crowd: heads, necks, raised arms */}
      {front.map((p, i) => (
        <g key={`f${i}`} fill="#120d28" stroke="#120d28">
          <rect x={p.cx - 9} y={p.headY} width="18" height="40" strokeWidth="0" />
          <circle cx={p.cx} cy={p.headY} r="11" strokeWidth="0" />
          {p.raised && (
            <g strokeWidth="5" strokeLinecap="round" fill="none">
              <path d={`M${p.cx - 8} ${p.headY + 14} L${p.cx - 20} ${p.headY - 26}`} />
              <path d={`M${p.cx + 8} ${p.headY + 14} L${p.cx + 20} ${p.headY - 26}`} />
              <circle cx={p.cx - 20} cy={p.headY - 26} r="3.5" strokeWidth="0" fill="#120d28" />
              <circle cx={p.cx + 20} cy={p.headY - 26} r="3.5" strokeWidth="0" fill="#120d28" />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Hero({
  email,
  count,
}: {
  email: string;
  count: number;
}) {
  return (
    <section
      className="relative flex min-h-dvh flex-col overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 90% at 50% -10%, #4c1d95 0%, #2e1065 34%, #150c33 62%, #05050b 100%)",
      }}
    >
      {/* stage glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-18%] h-[55vh] w-[80vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(129,140,248,0.55) 0%, rgba(236,72,153,0.28) 40%, transparent 70%)",
        }}
      />
      {/* light beams */}
      <div
        className="pointer-events-none absolute left-[18%] top-[-10%] h-[120vh] w-[16vw] -rotate-[18deg] blur-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.14), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute right-[16%] top-[-10%] h-[120vh] w-[14vw] rotate-[16deg] blur-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(236,72,153,0.18), transparent 70%)",
        }}
      />
      {/* stage backlight so the crowd silhouette reads against the dark base */}
      <div
        className="pointer-events-none absolute bottom-[30vh] left-1/2 h-[30vh] w-[130vw] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,85,247,0.55) 0%, rgba(99,102,241,0.30) 42%, transparent 72%)",
        }}
      />

      <Crowd />

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
        <span className="hidden text-xs text-white/50 sm:block">
          Signed in as {email}
        </span>
      </div>

      {/* hero copy */}
      <div className="relative z-10 mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 pb-[16vh] text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Your live-music map
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          Every show you&apos;ve ever seen, on one map.
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
          Concert Map turns your gig history into a living map. Pin each concert
          by venue, import setlists straight from setlist.fm, and watch your
          stats add up — most-seen artists, cities and countries, and every song
          you&apos;ve heard live.
        </p>

        <div className="mt-9 flex flex-col items-center gap-4">
          <a
            href="#app"
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-100"
          >
            {count > 0
              ? `Open your map · ${count} show${count === 1 ? "" : "s"}`
              : "Open your map"}
          </a>
          <a
            href="#app"
            className="flex items-center gap-1 text-xs font-medium text-white/50 transition hover:text-white/80"
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
