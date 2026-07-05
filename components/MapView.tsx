"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Show } from "@/lib/types";

// Custom SVG pin so we don't depend on Leaflet's bundled marker images.
function pinIcon(active: boolean) {
  const color = active ? "#4f46e5" : "#e11d48";
  return L.divIcon({
    className: "concert-pin",
    html: `<svg width="30" height="40" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
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
}: {
  shows: Show[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const mappable = shows.filter(hasCoords);

  return (
    <MapContainer
      center={[30, 0]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      className="h-full w-full"
      style={{ background: "#e5e7eb" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds shows={mappable} />
      <FlyToSelected shows={mappable} selectedId={selectedId} />
      {mappable.map((show) => (
        <Marker
          key={show.id}
          position={[show.latitude, show.longitude]}
          icon={pinIcon(show.id === selectedId)}
          eventHandlers={{ click: () => onSelect(show.id) }}
        >
          <Popup>
            <div className="text-sm">
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
  );
}
