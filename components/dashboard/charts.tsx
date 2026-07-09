import type { DashboardData, RankItem } from "@/lib/stats";

// Custom SVG/CSS charts — quiet neutral bars with the maximum emphasized in
// the gold accent, direct value labels, tabular numerals. No charting library.

export function Card({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-5 ${className ?? ""}`}
    >
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        {title}
      </h3>
      {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function KpiTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  /** Headline tile — renders the value in the gold accent. */
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        {label}
      </div>
      <div
        className={`mt-1 truncate text-2xl font-extrabold tabular-nums ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </div>
      {sub && <div className="truncate text-xs text-ink-2">{sub}</div>}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-ink-3">{children}</p>;
}

/** Vertical bars for a small ordered series (years, months). */
export function ColumnBars({
  items,
  tick,
}: {
  items: { label: string; count: number }[];
  tick?: (label: string) => string;
}) {
  if (!items.length) return <EmptyNote>No data yet.</EmptyNote>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div>
      <div className="flex h-40 items-stretch gap-1.5">
        {items.map((d) => (
          <div
            key={d.label}
            className="group flex flex-1 flex-col items-center justify-end gap-1"
            title={`${d.label}: ${d.count}`}
          >
            {d.count > 0 && (
              <span className="text-[11px] font-medium tabular-nums text-ink-2">
                {d.count}
              </span>
            )}
            <div
              className={`w-full rounded-t-md transition ${
                d.count === max
                  ? "bg-accent"
                  : "bg-ink-3/30 group-hover:bg-ink-3/50"
              }`}
              style={{ height: `${(d.count / max) * 88}%`, minHeight: d.count ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {items.map((d) => (
          <span
            key={d.label}
            className="flex-1 text-center text-[10px] tabular-nums text-ink-3"
          >
            {tick ? tick(d.label) : d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Ranked horizontal bars (artists, venues, cities, songs, countries). */
export function RankedBars({ items }: { items: RankItem[] }) {
  if (!items.length) return <EmptyNote>Nothing to rank yet.</EmptyNote>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it) => (
        <div
          key={it.label}
          className="group flex items-center gap-3"
          title={`${it.label}: ${it.count}`}
        >
          <span className="w-28 shrink-0 truncate text-sm text-ink-2">
            {it.label}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded-md bg-raised">
            <div
              className={`h-full rounded-md transition ${
                it.count === max
                  ? "bg-accent"
                  : "bg-ink-3/30 group-hover:bg-ink-3/50"
              }`}
              style={{ width: `${(it.count / max) * 100}%`, minWidth: 6 }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-ink-2">
            {it.count}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Cumulative area + line over time, with an emphasized endpoint. */
export function AreaLine({ data }: { data: { year: string; total: number }[] }) {
  if (data.length < 2)
    return <EmptyNote>Add shows across a few years to see growth.</EmptyNote>;

  const max = Math.max(...data.map((d) => d.total), 1);
  const n = data.length;
  const pts = data.map((d, i) => ({
    x: 2 + (i / (n - 1)) * 96,
    y: 6 + (1 - d.total / max) * 88,
  }));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
  const area = `${line} L98 100 L2 100 Z`;
  const last = pts[n - 1];

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-40 w-full"
        >
          <defs>
            {/* SVG presentation attributes can't take var() — set via style */}
            <linearGradient id="cm-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--accent)" }} stopOpacity="0.28" />
              <stop offset="1" style={{ stopColor: "var(--accent)" }} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#cm-area)" />
          <path
            d={line}
            fill="none"
            style={{ stroke: "var(--accent)" }}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${last.x}%`, top: `${last.y}%` }}
        >
          <span className="block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[10px] tabular-nums text-ink-3">
        <span>{data[0].year}</span>
        <span className="font-medium text-ink-2">
          {data[n - 1].total} total
        </span>
        <span>{data[n - 1].year}</span>
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  if (/^\d{4}$/.test(iso)) return iso;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export function Milestones({ m }: { m: DashboardData["milestones"] }) {
  const items = [
    m.firstShow && {
      k: "First show",
      v: m.firstShow.artist,
      s: fmtDate(m.firstShow.date),
    },
    m.latestShow && {
      k: "Latest show",
      v: m.latestShow.artist,
      s: fmtDate(m.latestShow.date),
    },
    m.biggestYear && {
      k: "Biggest year",
      v: m.biggestYear.year,
      s: `${m.biggestYear.count} show${m.biggestYear.count === 1 ? "" : "s"}`,
    },
    m.longestGapDays != null && {
      k: "Longest gap",
      v: `${m.longestGapDays} days`,
      s: "between shows",
    },
  ].filter(Boolean) as { k: string; v: string; s: string }[];

  if (!items.length) return <EmptyNote>Add a few shows to unlock milestones.</EmptyNote>;

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <div key={it.k} className="rounded-xl bg-raised p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {it.k}
          </div>
          <div className="mt-0.5 truncate text-base font-semibold text-ink">
            {it.v}
          </div>
          <div className="truncate text-xs text-ink-2">{it.s}</div>
        </div>
      ))}
    </div>
  );
}
