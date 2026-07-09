"use client";

import { useMemo } from "react";
import { computeStats } from "@/lib/stats";
import type { Show } from "@/lib/types";

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-3">
        {label}
      </div>
      <div className="mt-0.5 truncate text-lg font-semibold text-ink">
        {value}
      </div>
      {sub && <div className="truncate text-xs text-ink-2">{sub}</div>}
    </div>
  );
}

export default function StatsPanel({ shows }: { shows: Show[] }) {
  const stats = useMemo(() => computeStats(shows), [shows]);

  if (shows.length === 0) {
    return (
      <p className="text-sm text-ink-2">
        Add your first show to see your stats.
      </p>
    );
  }

  const maxYear = Math.max(...stats.showsPerYear.map((y) => y.count), 1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Shows" value={stats.totalShows} />
        <StatTile label="Songs seen" value={stats.totalSongs} />
        <StatTile label="Cities" value={stats.cities} />
        <StatTile label="Countries" value={stats.countries} />
      </div>

      <StatTile
        label="Most-seen artist"
        value={stats.mostSeenArtist?.name ?? "—"}
        sub={
          stats.mostSeenArtist
            ? `${stats.mostSeenArtist.count} show${
                stats.mostSeenArtist.count > 1 ? "s" : ""
              }`
            : undefined
        }
      />

      <StatTile
        label="Most-played track"
        value={stats.mostPlayedTrack?.title ?? "—"}
        sub={
          stats.mostPlayedTrack
            ? `heard ${stats.mostPlayedTrack.count}×`
            : undefined
        }
      />

      {stats.showsPerYear.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-3">
            Shows per year
          </div>
          <div className="space-y-1.5">
            {stats.showsPerYear.map((y) => (
              <div key={y.year} className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-xs tabular-nums text-ink-2">
                  {y.year}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                  <div
                    className={`h-full rounded-full ${
                      y.count === maxYear ? "bg-accent" : "bg-ink-3/40"
                    }`}
                    style={{ width: `${(y.count / maxYear) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-ink-2">
                  {y.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
