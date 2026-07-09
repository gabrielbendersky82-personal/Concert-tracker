"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { firstPhotoSrc } from "@/lib/media";
import type { Show } from "@/lib/types";

// Custom SVG pin so we don't depend on Leaflet's bundled marker images.
// `color` sets the fill (e.g. per-attendee); the selected pin is enlarged with a
// white ring for emphasis.
function pinIcon(color: string, active: boolean) {
  const w = active ? 38 : 30;
  const h = active ? 50 : 40;
  return L.divIcon({
    className: "concert-pin",
    html: `<svg width="${w}" height="${h}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="${
        active ? "#ffffff" : "none"
      }" stroke-width="${active ? 1.5 : 0}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 2],
  });
}

type MappableShow = Show & { latitude: number; longitude: number };

function hasCoords(show: Show): show is MappableShow {
  return show.latitude != null && show.longitude != null;
}

function FitBounds({ shows }: { shows: MappableShow[] }) {
  const map = useMap();
  useEffect(() => {
    if (shows.length === 0) return;
    const points = shows.map(
      (s) => [s.latitude, s.longitude] as [number, number]
    );
    if (points.length === 1) {
      map.setView(points[0], 6);
    } else {
      map.fitBounds(points, { padding: [60, 60], maxZoom: 11 });
    }
  }, [shows, map]);
  return null;
}

function FlyToSelected({ shows, selectedId }: { shows: MappableShow[]; selectedId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const target = shows.find((s) => s.id === selectedId);
    if (target) {
      map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 9), {
        duration: 0.8,
      });
    }
  }, [selectedId, shows, map]);
  return null;
}

export default function MapView({
  shows,
  selectedId,
  onSelect,
  colorOf,
  legend,
}: {
  shows: Show[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  colorOf?: (show: Show) => string;
  legend?: { label: string; color: string }[];
}) {
  const mappable = shows.filter(hasCoords);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[30, 0]}
        zoom={2}
        minZoom={2}
        worldCopyJump
        className="h-full w-full"
        style={{ background: "#e5e7eb" }}
      >
        <TileLayer
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitBounds shows={mappable} />
        <FlyToSelected shows={mappable} selectedId={selectedId} />
        {mappable.map((show) => (
          <Marker
            key={show.id}
            position={[show.latitude, show.longitude]}
            icon={pinIcon(colorOf?.(show) ?? "#e11d48", show.id === selectedId)}
            eventHandlers={{ click: () => onSelect(show.id) }}
          >
          <Popup>
            <div className="w-44 text-sm">
              {firstPhotoSrc(show) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstPhotoSrc(show) as string}
                  alt=""
                  className="mb-1.5 h-24 w-full rounded-md object-cover"
                />
              )}
              <div className="font-semibold text-slate-900">{show.artist}</div>
              {show.venue && <div className="text-slate-600">{show.venue}</div>}
              <div className="text-slate-500">
                {[show.city, show.country].filter(Boolean).join(", ")}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {show.show_date}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      </MapContainer>

      {legend && legend.length > 0 && (
        <div className="pointer-events-auto absolute bottom-3 left-3 z-[600] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Who went
          </div>
          <ul className="space-y-1">
            {legend.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-xs text-slate-700">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
