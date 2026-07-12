"use client";

import { useRef, useState } from "react";
import {
  createShow,
  geocode,
  importFromSetlistFm,
  searchSetlistFm,
  type SetlistFmResult,
} from "@/lib/shows";
import { addShowVideo, uploadShowPhoto } from "@/lib/media";
import { scanTicket } from "@/lib/ticketScan";
import type { NewShowInput } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-line-2 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25";
const labelClass = "mb-1 block text-xs font-medium text-ink-2";

type Mode = "search" | "scan" | "url" | "manual";

const METHODS: {
  id: Mode;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  { id: "search", label: "Search", icon: SearchIcon },
  { id: "scan", label: "Scan", icon: TicketIcon },
  { id: "url", label: "Link", icon: LinkIcon },
  { id: "manual", label: "Manual", icon: PencilIcon },
];

export default function AddShowForm({
  onCreated,
  saveShow,
}: {
  onCreated: () => void | Promise<void>;
  /** Override where the show is saved (demo mode persists to the browser
   *  instead of Supabase). When set, the photo/video fields are hidden —
   *  media needs a signed-in account. */
  saveShow?: (input: NewShowInput) => Promise<string>;
}) {
  const mediaEnabled = !saveShow;
  const [artist, setArtist] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState("");
  const [setlist, setSetlist] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [videoLinks, setVideoLinks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // How the user is adding this show.
  const [mode, setMode] = useState<Mode>("search");
  // True once a search result / pasted link has populated the detail fields, so
  // the "Review & save" section reveals in search/url modes.
  const [hasDraft, setHasDraft] = useState(false);

  // setlist.fm import (paste link)
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState("");
  // setlist.fm search
  const [sArtist, setSArtist] = useState("");
  const [sCity, setSCity] = useState("");
  const [sYear, setSYear] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SetlistFmResult[] | null>(null);
  // ticket photo scan
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  // Coordinates supplied by setlist.fm, so we can skip geocoding on save.
  const [importedCoords, setImportedCoords] = useState<
    { lat: number; lon: number } | null
  >(null);

  // Detail fields are always shown in manual mode; in search/url modes they
  // appear only after a draft has been loaded from setlist.fm.
  const showDetails = mode === "manual" || hasDraft;

  function reset() {
    setArtist("");
    setVenue("");
    setCity("");
    setCountry("");
    setDate("");
    setSetlist("");
    setNotes("");
    setPhotos([]);
    setVideoLinks("");
    setImportUrl("");
    setImportNote("");
    setImportedCoords(null);
    setResults(null);
    setSArtist("");
    setSCity("");
    setSYear("");
    setHasDraft(false);
  }

  function selectMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function handleSearch() {
    if (!sArtist.trim() && !sCity.trim()) return;
    setSearching(true);
    setError("");
    setResults(null);
    try {
      const found = await searchSetlistFm({
        artist: sArtist.trim(),
        city: sCity.trim(),
        year: sYear.trim(),
      });
      setResults(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  function applyResult(r: SetlistFmResult) {
    setArtist(r.artist);
    setVenue(r.venue);
    setCity(r.city);
    setCountry(r.country);
    setDate(r.date);
    setSetlist(r.setlist.join("\n"));
    setImportedCoords(
      r.latitude != null && r.longitude != null
        ? { lat: r.latitude, lon: r.longitude }
        : null
    );
    setResults(null);
    setHasDraft(true);
    setImportNote(
      `Loaded ${r.artist}${r.songCount ? ` · ${r.songCount} songs` : ""}. Review and save.`
    );
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanning(true);
    setError("");
    setImportNote("");
    try {
      const r = await scanTicket(file);
      setArtist(r.artist);
      if (r.venue) setVenue(r.venue);
      if (r.city) setCity(r.city);
      if (r.country) setCountry(r.country);
      if (r.date) setDate(r.date);
      setImportedCoords(null);
      setHasDraft(true);
      const scansLeft =
        r.demoScansLeft === 1
          ? " 1 demo scan left this session."
          : r.demoScansLeft === 0
            ? " That was your last demo scan for this session."
            : "";
      setImportNote(
        `Read your ticket${r.artist ? `: ${r.artist}` : ""}.${
          r.note ? ` ${r.note}` : ""
        } Review and save.${scansLeft}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't scan that ticket.");
    } finally {
      setScanning(false);
    }
  }

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportNote("");
    setError("");
    try {
      const data = await importFromSetlistFm(importUrl);
      if (data.artist) setArtist(data.artist);
      if (data.venue) setVenue(data.venue);
      if (data.city) setCity(data.city);
      if (data.country) setCountry(data.country);
      if (data.date) setDate(data.date);
      if (data.setlist.length) setSetlist(data.setlist.join("\n"));
      setImportedCoords(
        data.latitude != null && data.longitude != null
          ? { lat: data.latitude, lon: data.longitude }
          : null
      );
      setHasDraft(true);
      setImportNote(
        `Imported ${data.artist}${
          data.setlist.length ? ` · ${data.setlist.length} songs` : ""
        }. Review and save.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!artist.trim() || !date) {
      setError("Artist and date are required.");
      return;
    }
    setBusy(true);
    setError("");

    try {
      // Prefer coordinates from setlist.fm; otherwise geocode the venue/city.
      let lat: number | null = importedCoords?.lat ?? null;
      let lon: number | null = importedCoords?.lon ?? null;
      let resolvedCountry = country.trim();

      if (lat == null || lon == null) {
        const place = [venue, city, country]
          .map((s) => s.trim())
          .filter(Boolean)
          .join(", ");
        if (place) {
          const coords = await geocode(place);
          if (coords) {
            lat = coords.lat;
            lon = coords.lon;
            if (!resolvedCountry && coords.country) resolvedCountry = coords.country;
          }
        }
      }

      const showId = await (saveShow ?? createShow)({
        artist,
        venue,
        city,
        country: resolvedCountry,
        show_date: date,
        notes,
        setlist: setlist.split("\n"),
        latitude: lat,
        longitude: lon,
      });

      // Attach any photos / videos to the new show (best-effort: the show is
      // already saved, so a media hiccup shouldn't block the success flow).
      // Skipped for demo saves — uploads need a signed-in account.
      if (mediaEnabled) {
        try {
          for (const file of photos) await uploadShowPhoto(showId, file);
          for (const link of videoLinks
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)) {
            await addShowVideo(showId, link);
          }
        } catch {
          /* media is optional; ignore individual failures */
        }
      }

      reset();
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the show.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Method selector — pick how to add this show. */}
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-raised p-1">
        {METHODS.map(
          ({ id, label, icon: Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectMode(id)}
              aria-pressed={active}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
          }
        )}
      </div>

      {/* Source input for the selected method (hidden in manual mode). */}
      {mode === "search" && (
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2">
            <input
              className={`${inputClass} col-span-3`}
              value={sArtist}
              onChange={(e) => setSArtist(e.target.value)}
              placeholder="Artist"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            />
            <input
              className={`${inputClass} col-span-2`}
              value={sCity}
              onChange={(e) => setSCity(e.target.value)}
              placeholder="City"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            />
            <input
              className={`${inputClass} col-span-1`}
              value={sYear}
              onChange={(e) => setSYear(e.target.value)}
              placeholder="Year"
              inputMode="numeric"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || (!sArtist.trim() && !sCity.trim())}
            className="w-full rounded-full bg-cta px-3 py-2 text-sm font-semibold text-cta-ink transition hover:opacity-90 disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search concerts"}
          </button>

          {results && (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {results.length === 0 ? (
                <p className="py-2 text-center text-xs text-ink-2">
                  No concerts found. Try just the artist, or a different city.
                </p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => applyResult(r)}
                    className="w-full rounded-lg border border-line bg-surface p-2 text-left transition hover:border-accent/40 hover:bg-raised"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">
                        {r.artist}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-ink-3">
                        {r.date || "—"}
                      </span>
                    </div>
                    <div className="truncate text-xs text-ink-2">
                      {[r.venue, r.city, r.country].filter(Boolean).join(" · ") ||
                        "Unknown venue"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-ink-3">
                      {r.songCount ? `${r.songCount} songs` : "no setlist"}
                      {r.tour ? ` · ${r.tour}` : ""}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {mode === "scan" && (
        <div className="space-y-1.5">
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            onChange={handleScan}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => scanInputRef.current?.click()}
            disabled={scanning}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-2 bg-surface px-3 py-6 text-sm font-medium text-ink-2 transition hover:border-accent/50 hover:text-ink disabled:opacity-60"
          >
            <TicketIcon className="h-5 w-5" />
            {scanning ? "Reading your ticket…" : "Photograph or upload a ticket"}
          </button>
          <p className="text-xs text-ink-3">
            Works with old paper stubs and QR e-tickets. We&apos;ll read the
            artist, venue and date so you can review and save.
          </p>
          {!mediaEnabled && (
            <p className="text-xs text-accent">
              Try it out — demo scanning is limited to 2 tickets per visit.
              Sign in to scan without limits.
            </p>
          )}
        </div>
      )}

      {mode === "url" && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              id="setlistfm"
              className={inputClass}
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Paste a setlist.fm URL"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
              className="shrink-0 rounded-full bg-cta px-3 py-2 text-sm font-semibold text-cta-ink transition hover:opacity-90 disabled:opacity-50"
            >
              {importing ? "…" : "Fetch"}
            </button>
          </div>
          <p className="text-xs text-ink-3">
            We&apos;ll pull the artist, venue, date and setlist automatically.
          </p>
        </div>
      )}

      {/* Confirmation note after a successful search/import. */}
      {!showDetails && importNote && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">{importNote}</p>
      )}

      {/* Detail fields — the manual entry / "Review & save" section. */}
      {showDetails && (
        <div className="space-y-3">
          {mode !== "manual" && (
            <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {importNote || "Review the details, then save."}
              </p>
              <button
                type="button"
                onClick={reset}
                className="shrink-0 text-xs font-medium text-ink-3 hover:text-ink-2"
              >
                Clear
              </button>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="artist">
              Artist *
            </label>
            <input
              id="artist"
              className={inputClass}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Fleetwood Mac"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="venue">
                Venue
              </label>
              <input
                id="venue"
                className={inputClass}
                value={venue}
                onChange={(e) => {
                  setVenue(e.target.value);
                  setImportedCoords(null);
                }}
                placeholder="Wembley Stadium"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="date">
                Date *
              </label>
              <input
                id="date"
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="city">
                City
              </label>
              <input
                id="city"
                className={inputClass}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setImportedCoords(null);
                }}
                placeholder="London"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="country">
                Country
              </label>
              <input
                id="country"
                className={inputClass}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United Kingdom"
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="setlist">
              Setlist{" "}
              <span className="font-normal text-ink-3">(one song per line)</span>
            </label>
            <textarea
              id="setlist"
              className={`${inputClass} min-h-[96px] resize-y`}
              value={setlist}
              onChange={(e) => setSetlist(e.target.value)}
              placeholder={"The Chain\nDreams\nGo Your Own Way"}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="notes">
              Notes
            </label>
            <input
              id="notes"
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Who you went with, memories…"
            />
          </div>

          {!mediaEnabled && (
            <p className="text-xs text-ink-3">
              Sign in to attach photos and videos to your shows.
            </p>
          )}

          {mediaEnabled && (
          <div>
            <label className={labelClass}>
              Photos{" "}
              <span className="font-normal text-ink-3">(optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-ink-2 file:mr-3 file:rounded-lg file:border-0 file:bg-raised file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-line"
            />
            {photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {photos.map((f, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="h-14 w-14 rounded-md object-cover ring-1 ring-line"
                  />
                ))}
              </div>
            )}
          </div>
          )}

          {mediaEnabled && (
          <div>
            <label className={labelClass} htmlFor="videos">
              YouTube videos{" "}
              <span className="font-normal text-ink-3">(one link per line)</span>
            </label>
            <textarea
              id="videos"
              className={`${inputClass} min-h-[60px] resize-y`}
              value={videoLinks}
              onChange={(e) => setVideoLinks(e.target.value)}
              placeholder={"https://youtu.be/…"}
            />
          </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-cta px-4 py-2 text-sm font-semibold text-cta-ink transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          >
            {busy ? "Finding location & saving…" : "Add show"}
          </button>
          <p className="text-center text-xs text-ink-3">
            We&apos;ll look up the venue&apos;s coordinates to place your pin.
          </p>
        </div>
      )}

      {/* Errors that occur before the detail fields are shown (search/import). */}
      {!showDetails && error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
