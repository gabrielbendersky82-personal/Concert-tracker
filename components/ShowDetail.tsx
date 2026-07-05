"use client";

import type { Show } from "@/lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ShowDetail({
  show,
  onClose,
  onDelete,
}: {
  show: Show;
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{show.artist}</h2>
          {show.venue && (
            <p className="text-sm text-slate-600">{show.venue}</p>
          )}
          <p className="text-sm text-slate-500">
            {[show.city, show.country].filter(Boolean).join(", ")}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatDate(show.show_date)}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {show.notes && (
        <p className="mt-3 rounded-lg bg-slate-50 p-2 text-sm italic text-slate-600">
          {show.notes}
        </p>
      )}

      <div className="mt-4 flex-1 overflow-y-auto">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Setlist{" "}
          {show.setlist_songs.length > 0 && `(${show.setlist_songs.length})`}
        </h3>
        {show.setlist_songs.length === 0 ? (
          <p className="text-sm text-slate-400">No setlist recorded.</p>
        ) : (
          <ol className="space-y-1">
            {show.setlist_songs.map((song) => (
              <li
                key={song.id}
                className="flex gap-2 text-sm text-slate-700"
              >
                <span className="w-5 shrink-0 text-right tabular-nums text-slate-400">
                  {song.position}
                </span>
                <span>{song.title}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <button
        onClick={() => onDelete(show.id)}
        className="mt-4 w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        Delete show
      </button>
    </div>
  );
}
