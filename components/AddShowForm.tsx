"use client";

import { useState } from "react";
import { createShow, geocode } from "@/lib/shows";

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

  function reset() {
    setArtist("");
    setVenue("");
    setCity("");
    setCountry("");
    setDate("");
    setSetlist("");
    setNotes("");
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
      const place = [venue, city, country].map((s) => s.trim()).filter(Boolean).join(", ");
      let coords: { lat: number; lon: number; country: string | null } | null =
        null;
      if (place) {
        coords = await geocode(place);
      }

      await createShow({
        artist,
        venue,
        city,
        country: country.trim() || coords?.country || "",
        show_date: date,
        notes,
        setlist: setlist.split("\n"),
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
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
            onChange={(e) => setVenue(e.target.value)}
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
            onChange={(e) => setCity(e.target.value)}
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
