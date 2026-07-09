import Link from "next/link";
import type { DashboardData } from "@/lib/stats";
import AppNav from "./AppNav";
import GuestBar from "./GuestBar";
import {
  AreaLine,
  Card,
  ColumnBars,
  KpiTile,
  Milestones,
  RankedBars,
} from "./dashboard/charts";

export default function DashboardView({
  data,
  handle,
  guest = false,
  attendeeBreakdown,
}: {
  data: DashboardData;
  handle: string;
  guest?: boolean;
  /** Demo only: per-person show counts to show a "Who went" card. */
  attendeeBreakdown?: { label: string; color: string; count: number }[];
}) {
  const empty = data.totalShows === 0;
  const breakdownMax = attendeeBreakdown
    ? Math.max(1, ...attendeeBreakdown.map((a) => a.count))
    : 1;

  return (
    <main className="min-h-dvh bg-slate-50">
      {guest ? (
        <GuestBar
          active="dashboard"
          showSections
          notice="You're exploring a live demo — sign in to build your own."
        />
      ) : (
        <AppNav active="dashboard" handle={handle} />
      )}
      <div className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Your Concert Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {empty
              ? "No shows logged yet."
              : `${data.totalShows} show${data.totalShows === 1 ? "" : "s"} · ${data.uniqueArtists} artist${data.uniqueArtists === 1 ? "" : "s"} · ${data.uniqueCountries} countr${data.uniqueCountries === 1 ? "y" : "ies"}`}
          </p>
        </div>

        {empty ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mb-2 text-3xl" aria-hidden>
              📊
            </div>
            <p className="font-medium text-slate-800">Nothing to chart yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add or import a few shows, then come back to see your stats.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go add shows
            </Link>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiTile label="Shows" value={data.totalShows} />
              <KpiTile label="Artists" value={data.uniqueArtists} />
              <KpiTile label="Venues" value={data.uniqueVenues} />
              <KpiTile label="Cities" value={data.uniqueCities} />
              <KpiTile label="Countries" value={data.uniqueCountries} />
              <KpiTile label="Songs seen" value={data.totalSongs} />
              <KpiTile label="Unique songs" value={data.uniqueSongs} />
              <KpiTile
                label="Avg setlist"
                value={data.avgSetlist || "—"}
                sub={data.avgSetlist ? "songs / show" : undefined}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              {attendeeBreakdown && attendeeBreakdown.length > 0 && (
                <Card
                  title="Who went"
                  subtitle="Shows per person"
                  className="md:col-span-2"
                >
                  <ul className="space-y-2.5">
                    {attendeeBreakdown.map((a) => (
                      <li key={a.label} className="flex items-center gap-3">
                        <span className="flex w-16 shrink-0 items-center gap-1.5 text-sm font-medium text-slate-700">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: a.color }}
                          />
                          {a.label}
                        </span>
                        <span className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${(a.count / breakdownMax) * 100}%`,
                              background: a.color,
                            }}
                          />
                        </span>
                        <span className="w-6 shrink-0 text-right text-sm tabular-nums text-slate-500">
                          {a.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card title="Shows over time" subtitle="Cumulative total">
                <AreaLine data={data.cumulative} />
              </Card>
              <Card title="Shows per year">
                <ColumnBars items={data.showsPerYear.map((y) => ({ label: y.year, count: y.count }))} />
              </Card>

              <Card title="Top artists">
                <RankedBars items={data.topArtists} />
              </Card>
              <Card title="Top venues">
                <RankedBars items={data.topVenues} />
              </Card>

              <Card title="Top cities">
                <RankedBars items={data.topCities} />
              </Card>
              <Card title="Most-played songs">
                <RankedBars items={data.topSongs} />
              </Card>

              <Card title="When you go" subtitle="Shows by month">
                <ColumnBars
                  items={data.byMonth.map((m) => ({ label: m.month, count: m.count }))}
                  tick={(l) => l.charAt(0)}
                />
              </Card>
              <Card title="Countries visited">
                <RankedBars items={data.countries} />
              </Card>

              <Card title="Milestones" className="md:col-span-2">
                <Milestones m={data.milestones} />
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
