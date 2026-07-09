"use client";

import { useRef, useState } from "react";
import ShowMediaGallery from "./ShowMediaGallery";
import type { Show, ShowMedia } from "@/lib/types";

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
  onAddPhotos,
  onAddVideo,
  onDeleteMedia,
}: {
  show: Show;
  onClose: () => void;
  onDelete?: (id: string) => void | Promise<void>;
  onAddPhotos?: (showId: string, files: File[]) => Promise<void>;
  onAddVideo?: (showId: string, url: string) => Promise<void>;
  onDeleteMedia?: (m: ShowMedia) => Promise<void>;
}) {
  const media = show.show_media ?? [];
  const canEdit = !!onAddPhotos || !!onAddVideo;
  const fileRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState("");

  async function runMedia(fn: () => Promise<void>) {
    setMediaBusy(true);
    setMediaError("");
    try {
      await fn();
    } catch (err) {
      setMediaError(
        err instanceof Error ? err.message : "Could not update media."
      );
    } finally {
      setMediaBusy(false);
    }
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length && onAddPhotos) {
      await runMedia(() => onAddPhotos(show.id, files));
    }
  }

  async function handleAddVideo() {
    if (!videoUrl.trim() || !onAddVideo) return;
    await runMedia(async () => {
      await onAddVideo(show.id, videoUrl);
      setVideoUrl("");
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{show.artist}</h2>
          {show.venue && (
            <p className="text-sm text-ink-2">{show.venue}</p>
          )}
          <p className="text-sm text-ink-2">
            {[show.city, show.country].filter(Boolean).join(", ")}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            {formatDate(show.show_date)}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="rounded-full p-1 text-ink-3 hover:bg-raised hover:text-ink-2"
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
        <p className="mt-3 rounded-lg bg-raised p-2 text-sm italic text-ink-2">
          {show.notes}
        </p>
      )}

      <div className="mt-4 flex-1 overflow-y-auto">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-3">
          Setlist{" "}
          {show.setlist_songs.length > 0 && `(${show.setlist_songs.length})`}
        </h3>
        {show.setlist_songs.length === 0 ? (
          <p className="text-sm text-ink-3">No setlist recorded.</p>
        ) : (
          <ol className="space-y-1">
            {show.setlist_songs.map((song) => (
              <li
                key={song.id}
                className="flex gap-2 text-sm text-ink-2"
              >
                <span className="w-5 shrink-0 text-right tabular-nums text-ink-3">
                  {song.position}
                </span>
                <span>{song.title}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <ShowMediaGallery
        media={media}
        onDelete={
          onDeleteMedia
            ? (m) => runMedia(() => onDeleteMedia(m))
            : undefined
        }
      />

      {canEdit && (
        <div className="mt-4 space-y-2 rounded-lg border border-line bg-raised p-3">
          <p className="text-xs font-medium text-ink-2">Add photos & videos</p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={mediaBusy}
              className="rounded-lg border border-line-2 bg-surface px-3 py-1.5 text-sm font-medium text-ink-2 transition hover:bg-raised disabled:opacity-60"
            >
              📷 Upload photos
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddVideo())
              }
              placeholder="Paste a YouTube link"
              className="w-full rounded-lg border border-line-2 bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
            <button
              type="button"
              onClick={handleAddVideo}
              disabled={mediaBusy || !videoUrl.trim()}
              className="shrink-0 rounded-full bg-cta px-3 py-1.5 text-sm font-semibold text-cta-ink transition hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {mediaBusy && <p className="text-xs text-ink-3">Working…</p>}
          {mediaError && <p className="text-xs text-red-600 dark:text-red-400">{mediaError}</p>}
        </div>
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(show.id)}
          className="mt-4 w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
        >
          Delete show
        </button>
      )}
    </div>
  );
}
