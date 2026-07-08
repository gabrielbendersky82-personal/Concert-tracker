"use client";

import { useState } from "react";
import { mediaSrc } from "@/lib/media";
import type { ShowMedia } from "@/lib/types";

/**
 * Read-only display of a show's photos and YouTube videos. Photos open in a
 * lightbox; video thumbnails swap to an embedded player only when clicked (so no
 * iframe loads up front). Owner edit controls live in ShowDetail, not here.
 */
export default function ShowMediaGallery({
  media,
  onDelete,
}: {
  media: ShowMedia[];
  onDelete?: (m: ShowMedia) => void;
}) {
  const photos = media.filter((m) => m.kind === "photo");
  const videos = media.filter((m) => m.kind === "video" && m.youtube_id);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  if (media.length === 0) return null;

  function DeleteBadge({ m }: { m: ShowMedia }) {
    if (!onDelete) return null;
    return (
      <button
        type="button"
        aria-label="Remove"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(m);
        }}
        className="absolute right-1 top-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {photos.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Photos {`(${photos.length})`}
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((p) => {
              const src = mediaSrc(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightbox(src)}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                >
                  <DeleteBadge m={p} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={p.caption ?? "Concert photo"}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Videos {`(${videos.length})`}
          </h3>
          <div className="space-y-2">
            {videos.map((v) => {
              const id = v.youtube_id as string;
              return playing === v.id ? (
                <div
                  key={v.id}
                  className="aspect-video overflow-hidden rounded-lg bg-black"
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                    title={v.caption ?? "Concert video"}
                    allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setPlaying(v.id)}
                  className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-slate-900"
                >
                  <DeleteBadge m={v} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaSrc(v)}
                    alt={v.caption ?? "Concert video"}
                    loading="lazy"
                    className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                  />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white transition group-hover:bg-red-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                  {v.caption && (
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-left text-xs text-white">
                      {v.caption}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Concert photo"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
