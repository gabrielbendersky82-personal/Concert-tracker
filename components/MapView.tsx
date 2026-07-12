"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { firstPhotoSrc } from "@/lib/media";
import { useTheme } from "@/lib/theme";
import { isUpcoming, todayISO } from "@/lib/upcoming";
import { attendeeName, type Show } from "@/lib/types";

// CARTO basemaps per theme: voyager for light, dark_all for dark so the
// colored pins glow against the near-black tiles.
const TILE_URL = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
} as const;

// Custom SVG pin so we don't depend on Leaflet's bundled marker images.
// `color` sets the fill (e.g. per-attendee); the selected pin is enlarged with a
// white ring for emphasis. When `count` > 1 the pin head shows the number of
// shows at that spot instead of the plain dot. Upcoming shows render hollow —
// an outlined pin waiting to be filled in.
function pinIcon(color: string, active: boolean, count = 1, upcoming = false) {
  const w = active ? 38 : 30;
  const h = active ? 50 : 40;
  const label = count > 99 ? "99+" : String(count);
  const fontSize = label.length > 2 ? 6.5 : label.length > 1 ? 8 : 9.5;
  const headFill = upcoming ? color : "white";
  const textFill = upcoming ? "white" : color;
  const head =
    count > 1
      ? `<circle cx="12" cy="12" r="7" fill="${headFill}"/>
      <text x="12" y="12" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${textFill}">${label}</text>`
      : `<circle cx="12" cy="12" r="${upcoming ? 4 : 5}" fill="${headFill}"/>`;
  const body = upcoming
    ? `fill="var(--surface)" stroke="${color}" stroke-width="2.5"`
    : `fill="${color}" stroke="${active ? "#ffffff" : "none"}" stroke-width="${
        active ? 1.5 : 0
      }"`;
  return L.divIcon({
    className: "concert-pin",
    html: `<svg width="${w}" height="${h}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" ${body}/>
      ${head}
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

// Shows that would render on top of each other collapse into one pin with a
// count badge and a list popup, instead of stacking invisibly. Grouping is
// zoom-aware (lightweight clustering): zoomed out, nearby venues in the same
// city merge; zoomed in, only shows at the same venue share a pin. The cell
// size targets ~40px of screen space at the given zoom.
type PinGroup = {
  key: string;
  latitude: number;
  longitude: number;
  shows: MappableShow[];
};

function groupShows(shows: MappableShow[], zoom: number): PinGroup[] {
  const cell = zoom >= 13 ? 0 : (40 * 360) / (256 * 2 ** zoom);
  const keyOf = (s: MappableShow) =>
    cell === 0
      ? `${s.latitude.toFixed(5)},${s.longitude.toFixed(5)}`
      : `${Math.round(s.latitude / cell)},${Math.round(s.longitude / cell)}`;

  const groups = new Map<string, MappableShow[]>();
  for (const s of shows) {
    const key = keyOf(s);
    const g = groups.get(key);
    if (g) g.push(s);
    else groups.set(key, [s]);
  }
  return [...groups.entries()].map(([key, members]) => {
    // Latest show first inside each group; pin sits at the members' centroid.
    members.sort((a, b) => b.show_date.localeCompare(a.show_date));
    const lat =
      members.reduce((sum, s) => sum + s.latitude, 0) / members.length;
    const lng =
      members.reduce((sum, s) => sum + s.longitude, 0) / members.length;
    return { key, latitude: lat, longitude: lng, shows: members };
  });
}

// Header for a multi-show popup: the venue if they all share one, else the
// (majority) city, else a generic area label.
function groupPlace(shows: MappableShow[]): string {
  const venues = new Set(shows.map((s) => s.venue).filter(Boolean));
  const cities = new Set(shows.map((s) => s.city).filter(Boolean));
  if (venues.size === 1) {
    return [
      [...venues][0],
      cities.size === 1 ? [...cities][0] : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (cities.size === 1) return [...cities][0] as string;
  if (cities.size > 1) {
    // Most frequent city among the grouped shows.
    const counts = new Map<string, number>();
    for (const s of shows) {
      if (!s.city) continue;
      counts.set(s.city, (counts.get(s.city) ?? 0) + 1);
    }
    let best = "";
    let n = 0;
    for (const [c, k] of counts) {
      if (k > n) {
        n = k;
        best = c;
      }
    }
    return `${best} area`;
  }
  return "This area";
}

// Re-groups pins whenever the user zooms.
function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });
  return null;
}

// Pin color for a group: the most frequent attendee color among its shows.
function groupColor(
  shows: MappableShow[],
  colorOf?: (show: Show) => string
): string {
  if (!colorOf) return "#e11d48";
  const counts = new Map<string, number>();
  for (const s of shows) {
    const c = colorOf(s);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best = "#e11d48";
  let n = 0;
  for (const [c, k] of counts) {
    if (k > n) {
      n = k;
      best = c;
    }
  }
  return best;
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
  const [zoom, setZoom] = useState(2);
  const theme = useTheme();
  const mappable = useMemo(() => shows.filter(hasCoords), [shows]);
  const groups = useMemo(() => groupShows(mappable, zoom), [mappable, zoom]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[30, 0]}
        zoom={2}
        minZoom={2}
        worldCopyJump
        className="h-full w-full"
        style={{ background: "var(--raised)" }}
      >
        {/* key forces a remount on theme change — react-leaflet ignores url updates */}
        <TileLayer
          key={theme}
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={TILE_URL[theme]}
        />
        <FitBounds shows={mappable} />
        <FlyToSelected shows={mappable} selectedId={selectedId} />
        <ZoomWatcher onZoom={setZoom} />
        {groups.map((group) => {
          const single = group.shows.length === 1;
          const show = group.shows[0];
          const active = group.shows.some((s) => s.id === selectedId);
          const place = groupPlace(group.shows);
          const today = todayISO();
          const upcoming = group.shows.every((s) => isUpcoming(s, today));
          return (
            <Marker
              key={group.key}
              position={[group.latitude, group.longitude]}
              icon={pinIcon(
                groupColor(group.shows, colorOf),
                active,
                group.shows.length,
                upcoming
              )}
              // Badged pins float above singles so counts never hide.
              zIndexOffset={single ? 0 : 250}
              eventHandlers={
                single ? { click: () => onSelect(show.id) } : undefined
              }
            >
              {single ? (
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
                    <div className="font-semibold text-ink">{show.artist}</div>
                    {show.venue && <div className="text-ink-2">{show.venue}</div>}
                    <div className="text-ink-2">
                      {[show.city, show.country].filter(Boolean).join(", ")}
                    </div>
                    <div className="mt-1 text-xs text-ink-3">
                      {show.show_date}
                    </div>
                    {(show.show_attendees?.length ?? 0) > 0 && (
                      <div className="mt-1 text-xs font-medium text-accent">
                        with{" "}
                        {show
                          .show_attendees!.map((a) => attendeeName(a))
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </Popup>
              ) : (
                <Popup>
                  <div className="w-52 text-sm">
                    <div className="font-semibold text-ink">{place}</div>
                    <div className="mb-1.5 text-xs text-ink-3">
                      {group.shows.length} shows here
                    </div>
                    <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                      {group.shows.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(s.id)}
                            className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left transition hover:bg-raised"
                          >
                            {colorOf && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ background: colorOf(s) }}
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate font-medium text-ink">
                              {s.artist}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-ink-3">
                              {s.show_date.slice(0, 4)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {legend && legend.length > 0 && (
        <div className="pointer-events-auto absolute bottom-3 left-3 z-[600] rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-lg backdrop-blur">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
            Who went
          </div>
          <ul className="space-y-1">
            {legend.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-xs text-ink-2">
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
