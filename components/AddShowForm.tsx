"use client";

import { useState } from "react";
import {
  createShow,
  geocode,
  importFromSetlistFm,
  searchSetlistFm,
  type SetlistFmResult,
} from "@/lib/shows";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const labelClass = "mb-1 block text-xs font-medium text-slate-600";

export default function AddShowForm({
  onCreated,
}: {
  onCreated: () => void | Promise<void>;
}) {
  const [artist, setArtist] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState("");
  const [setlist, setSetlist] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // setlist.fm import / search
  const [fmMode, setFmMode] = useState<"search" | "url">("search");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState("");
  // search
  const [sArtist, setSArtist] = useState("");
  const [sCity, setSCity] = useState("");
  const [sYear, setSYear] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SetlistFmResult[] | null>(null);
  // Coordinates supplied by setlist.fm, so we can skip geocoding on save.
  const [importedCoords, setImportedCoords] = useState<
    { lat: number; lon: number } | null
  >(null);

  function reset() {
    setArtist("");
    setVenue("");
    setCity("");
    setCountry("");
    setDate("");
    setSetlist("");
    setNotes("");
    setImportUrl("");
    setImportNote("");
    setImportedCoords(null);
    setResults(null);
    setSArtist("");
    setSCity("");
    setSYear("");
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
    setImportNote(
      `Loaded ${r.artist}${r.songCount ? ` · ${r.songCount} songs` : ""}. Review and save.`
    );
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

      await createShow({
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
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
        <div className="mb-2 flex items-center gap-1">
          {(["search", "url"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFmMode(m)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                fmMode === m
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              {m === "search" ? "Search setlist.fm" : "Paste link"}
            </button>
          ))}
        </div>

        {fmMode === "search" ? (
          <>
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
              className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {searching ? "Searching…" : "Search concerts"}
            </button>

            {results && (
              <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-500">
                    No concerts found. Try just the artist, or a different city.
                  </p>
                ) : (
                  results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => applyResult(r)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">
                          {r.artist}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-slate-400">
                          {r.date || "—"}
                        </span>
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {[r.venue, r.city, r.country].filter(Boolean).join(" · ") ||
                          "Unknown venue"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {r.songCount ? `${r.songCount} songs` : "no setlist"}
                        {r.tour ? ` · ${r.tour}` : ""}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
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
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {importing ? "…" : "Fetch"}
            </button>
          </div>
        )}

        {importNote && (
          <p className="mt-2 text-xs text-emerald-700">{importNote}</p>
        )}
      </div>

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
          <span className="font-normal text-slate-400">(one song per line)</span>
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

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
      >
        {busy ? "Finding location & saving…" : "Add show"}
      </button>
      <p className="text-center text-xs text-slate-400">
        We&apos;ll look up the venue&apos;s coordinates to place your pin.
      </p>
    </form>
  );
}
