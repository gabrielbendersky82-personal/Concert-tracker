import type { ReactElement } from "react";

/**
 * Shared 1200×630 share-card layout for opengraph-image routes, rendered by
 * next/og (satori: flexbox-only, inline styles). Dark TIDAL-style ground with
 * the gold pin brand mark so links unfurl in the app's own look.
 */
export function ogCard({
  eyebrow,
  title,
  subtitle,
  stats = [],
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  stats?: { value: string; label: string }[];
}): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        backgroundColor: "#0b0b0f",
        backgroundImage:
          "radial-gradient(circle at 85% 10%, rgba(240,180,41,0.14), transparent 55%), radial-gradient(circle at 10% 95%, rgba(79,70,229,0.22), transparent 50%)",
        fontFamily: "sans-serif",
      }}
    >
      {/* Brand row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="44" height="44" viewBox="0 0 24 32">
          <path
            d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z"
            fill="#f0b429"
          />
          <circle cx="12" cy="12" r="5" fill="#0b0b0f" />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            color: "#f4f4f6",
            letterSpacing: -0.5,
          }}
        >
          Concert Map
        </div>
      </div>

      {/* Title block */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 5,
            color: "#f0b429",
          }}
        >
          {eyebrow.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            color: "#f4f4f6",
            letterSpacing: -2,
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#a6a4b0",
              maxWidth: 950,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 48,
                fontWeight: 800,
                color: "#f0b429",
              }}
            >
              {s.value}
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "#a6a4b0" }}>
              {s.label}
            </div>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            marginLeft: "auto",
            alignItems: "center",
            gap: 12,
          }}
        >
          {["#4f46e5", "#ec4899", "#f59e0b"].map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: c,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const OG_SIZE = { width: 1200, height: 630 };

/** Compact stats for a set of shows: count, cities, year span. */
export function showStats(
  shows: { city: string | null; show_date: string }[]
): { value: string; label: string }[] {
  if (shows.length === 0) return [];
  const cities = new Set(shows.map((s) => s.city).filter(Boolean));
  const years = shows.map((s) => s.show_date.slice(0, 4)).sort();
  return [
    { value: String(shows.length), label: "shows" },
    { value: String(cities.size), label: "cities" },
    {
      value:
        years[0] === years[years.length - 1]
          ? years[0]
          : `${years[0]}–${years[years.length - 1]}`,
      label: "years",
    },
  ];
}
