"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppNav from "./AppNav";
import GuestBar from "./GuestBar";
import { spotifySearchUrl } from "./SpotifyPlaylist";
import { isUpcoming, todayISO, untilLabel } from "@/lib/upcoming";
import type { Show } from "@/lib/types";
import type { Attendee } from "@/lib/demoShows";

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/** Big artist portrait via the Deezer proxy, monogram fallback. */
function Portrait({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl text-3xl font-extrabold text-white/90 shadow-lg sm:h-24 sm:w-24"
      style={{ background: "linear-gradient(150deg,#818cf8,#ec4899)" }}
    >
      {(name || "?").charAt(0).toUpperCase()}
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/artist-image?name=${encodeURIComponent(name)}`}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  );
}

function VenueMark() {
  return (
    <span
      className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl shadow-lg sm:h-24 sm:w-24"
      style={{ background: "linear-gradient(150deg,#818cf8,#ec4899)" }}
    >
      <svg viewBox="0 0 24 24" fill="white" className="h-10 w-10">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
      </svg>
    </span>
  );
}

export default function EntityView({
  kind,
  name,
  shows,
  handle,
  guest = false,
  attendees,
  myId,
}: {
  kind: "artist" | "venue";
  /** Decoded artist/venue name from the URL. */
  name: string;
  /** Full collection (mine + friends) — friends power the "also seen by" line. */
  shows: Show[];
  handle: string;
  guest?: boolean;
  attendees?: Attendee[];
  myId?: string;
}) {
  const base = guest ? "/demo" : "";
  const today = todayISO();

  const {
    displayName,
    mine,
    friendCounts,
    cities,
    countries,
    artistsHosted,
    songsHeard,
    topSongs,
    span,
    place,
  } = useMemo(() => {
    const key = norm(name);
    const matches = shows.filter((s) =>
      kind === "artist" ? norm(s.artist) === key : norm(s.venue) === key
    );
    const mine = (myId ? matches.filter((s) => s.user_id === myId) : matches).sort(
      (a, b) => b.show_date.localeCompare(a.show_date)
    );
    const displayName =
      (kind === "artist" ? matches[0]?.artist : matches[0]?.venue) ?? name;

    const friendCounts = new Map<string, number>();
    if (myId) {
      for (const s of matches) {
        if (s.user_id !== myId) {
          friendCounts.set(s.user_id, (friendCounts.get(s.user_id) ?? 0) + 1);
        }
      }
    }

    const cities = new Set(mine.map((s) => norm(s.city)).filter(Boolean));
    const countries = new Set(mine.map((s) => norm(s.country)).filter(Boolean));
    const artistsHosted = new Set(mine.map((s) => norm(s.artist)).filter(Boolean));
    const songsHeard = mine.reduce((n, s) => n + s.setlist_songs.length, 0);

    const songCounts = new Map<string, { title: string; count: number }>();
    if (kind === "artist") {
      for (const s of mine) {
        for (const song of s.setlist_songs) {
          const k = norm(song.title);
          if (!k) continue;
          const cur = songCounts.get(k);
          if (cur) cur.count += 1;
          else songCounts.set(k, { title: song.title, count: 1 });
        }
      }
    }
    const topSongs = [...songCounts.values()]
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
      .slice(0, 5);

    const past = mine.filter((s) => !isUpcoming(s, today));
    const years = past.map((s) => s.show_date.slice(0, 4)).sort();
    const span =
      years.length === 0
        ? ""
        : years[0] === years[years.length - 1]
          ? years[0]
          : `${years[0]}–${years[years.length - 1]}`;

    const place =
      kind === "venue"
        ? [mine[0]?.city, mine[0]?.country].filter(Boolean).join(", ")
        : "";

    return {
      displayName,
      mine,
      friendCounts,
      cities: cities.size,
      countries: countries.size,
      artistsHosted: artistsHosted.size,
      songsHeard,
      topSongs,
      span,
      place,
    };
  }, [shows, kind, name, myId, today]);

  const attendeeOf = (id: string) => attendees?.find((a) => a.id === id);
  const friendLine = [...friendCounts.entries()]
    .map(([id, n]) => {
      const a = attendeeOf(id);
      return a ? `${a.label}${n > 1 ? ` ×${n}` : ""}` : null;
    })
    .filter(Boolean)
    .join(" · ");

  const backHref = guest ? "/demo" : "/";
  const seen = mine.filter((s) => !isUpcoming(s, today)).length;
  const upcoming = mine.length - seen;

  return (
    <main className="min-h-dvh bg-ground">
      {guest ? (
        <GuestBar showSections notice="You're exploring a live demo — sign in to build your own." />
      ) : (
        <AppNav active="map" handle={handle} />
      )}

      <div className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:px-6 md:pb-10">
        <Link href={backHref} className="text-xs font-medium text-ink-3 transition hover:text-ink">
          ← Back to the map
        </Link>

        {mine.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="font-medium text-ink">
              No shows for “{name}” yet
            </p>
            <p className="mt-1 text-sm text-ink-2">
              Add one from the map and it&apos;ll build this page.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mt-4 flex items-center gap-4 sm:gap-5">
              {kind === "artist" ? <Portrait name={displayName} /> : <VenueMark />}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
                  {kind === "artist" ? "Artist" : "Venue"}
                </p>
                <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
                  {displayName}
                </h1>
                <p className="mt-1 text-sm text-ink-2">
                  {kind === "artist" ? (
                    <>
                      Seen <b className="text-ink">{seen}</b> time{seen === 1 ? "" : "s"}
                      {span && <> · {span}</>}
                      {upcoming > 0 && (
                        <span className="text-accent"> · {upcoming} coming up</span>
                      )}
                    </>
                  ) : (
                    <>
                      {place}
                      {span && <> · {span}</>}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <Tile value={String(mine.length)} label={`show${mine.length === 1 ? "" : "s"}`} />
              {kind === "artist" ? (
                <>
                  <Tile
                    value={String(cities)}
                    label={`${cities === 1 ? "city" : "cities"}${countries > 1 ? ` · ${countries} countries` : ""}`}
                  />
                  <Tile value={String(songsHeard)} label="songs heard live" />
                </>
              ) : (
                <>
                  <Tile value={String(artistsHosted)} label={`artist${artistsHosted === 1 ? "" : "s"} seen here`} />
                  <Tile
                    value={String(mine.reduce((n, s) => n + s.setlist_songs.length, 0))}
                    label="songs heard live"
                  />
                </>
              )}
            </div>

            {friendLine && (
              <p className="mt-3 text-xs text-ink-2">
                Also {kind === "artist" ? "seen" : "been here"}:{" "}
                <span className="font-semibold text-ink">{friendLine}</span>
              </p>
            )}

            {kind === "artist" && (
              <a
                href={spotifySearchUrl(displayName)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                style={{ background: "#1db954" }}
              >
                Open on Spotify
              </a>
            )}

            {/* Most-heard songs */}
            {topSongs.length > 0 && topSongs[0].count > 1 && (
              <section className="mt-7">
                <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
                  Most heard live
                </h2>
                <ol className="space-y-1">
                  {topSongs.map((s, i) => (
                    <li key={s.title} className="flex items-baseline gap-2 text-sm">
                      <span className="w-4 shrink-0 text-right tabular-nums text-ink-3">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-ink">{s.title}</span>
                      <span className="shrink-0 text-xs tabular-nums text-ink-3">×{s.count}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Shows */}
            <section className="mt-7">
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
                {kind === "artist" ? "Every time" : "Every show here"}
              </h2>
              <ul className="space-y-1.5">
                {mine.map((show) => {
                  const up = isUpcoming(show, today);
                  return (
                    <li key={show.id}>
                      <Link
                        href={`${base}/?show=${show.id}`}
                        className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5 transition hover:border-accent"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">
                            {kind === "artist"
                              ? [show.venue, show.city].filter(Boolean).join(" · ") || "—"
                              : show.artist}
                          </span>
                          <span className="block truncate text-xs text-ink-2">
                            {fmtDate(show.show_date)}
                            {kind === "venue" && show.city ? "" : ""}
                          </span>
                        </span>
                        {up ? (
                          <span className="shrink-0 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                            {untilLabel(show.show_date, today)}
                          </span>
                        ) : (
                          (show.rating ?? 0) > 0 && (
                            <span className="flex shrink-0 gap-1">
                              {Array.from({ length: show.rating! }, (_, i) => (
                                <i key={i} className="h-1.5 w-1.5 rounded-full bg-accent" />
                              ))}
                            </span>
                          )
                        )}
                        <span aria-hidden className="shrink-0 text-ink-3">›</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="text-xl font-extrabold tabular-nums text-accent">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
        {label}
      </div>
    </div>
  );
}
