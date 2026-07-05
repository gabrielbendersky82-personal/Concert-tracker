"use client";

import { useRef, useState } from "react";
import { bulkCreateShows } from "@/lib/shows";
import type { NewShowInput, Show } from "@/lib/types";

interface ExportFile {
  version: number;
  shows: Array<
    Omit<NewShowInput, "setlist"> & { setlist: string[] }
  >;
}

function toExport(shows: Show[]): ExportFile {
  return {
    version: 1,
    shows: shows.map((s) => ({
      artist: s.artist,
      venue: s.venue ?? "",
      city: s.city ?? "",
      country: s.country ?? "",
      latitude: s.latitude,
      longitude: s.longitude,
      show_date: s.show_date,
      notes: s.notes ?? "",
      setlist: s.setlist_songs.map((song) => song.title),
    })),
  };
}

export default function ImportExport({
  shows,
  onImported,
}: {
  shows: Show[];
  onImported: () => void | Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function handleExport() {
    const blob = new Blob([JSON.stringify(toExport(shows), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "concert-map-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ExportFile>;
      if (!Array.isArray(parsed.shows)) {
        throw new Error("File doesn't look like a Concert Map backup.");
      }
      const inputs: NewShowInput[] = parsed.shows.map((s) => ({
        artist: String(s.artist ?? "").trim(),
        venue: String(s.venue ?? ""),
        city: String(s.city ?? ""),
        country: String(s.country ?? ""),
        show_date: String(s.show_date ?? ""),
        notes: String(s.notes ?? ""),
        latitude: s.latitude ?? null,
        longitude: s.longitude ?? null,
        setlist: Array.isArray(s.setlist) ? s.setlist.map(String) : [],
      }));
      const valid = inputs.filter((s) => s.artist && s.show_date);
      const count = await bulkCreateShows(valid);
      setMessage(`Imported ${count} show${count === 1 ? "" : "s"}.`);
      await onImported();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Import failed. Check the file."
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={shows.length === 0}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Export JSON
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import JSON"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}
