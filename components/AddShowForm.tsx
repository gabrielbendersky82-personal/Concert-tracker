"use client";

import { useState } from "react";
import { createShow, geocode, importFromSetlistFm } from "@/lib/shows";

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

  // setlist.fm import
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState("");
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
        <label className={labelClass} htmlFor="setlistfm">
          Import from setlist.fm
        </label>
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
