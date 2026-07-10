import { todayISO } from "./upcoming";
import type { Show } from "./types";

export interface Memory {
  show: Show;
  yearsAgo: number;
  /** 0 = exactly this day, otherwise days off from today's month-day. */
  distance: number;
}

/**
 * A past show whose anniversary is today (or within ±3 days), for the
 * "on this day" banner. Exact-day matches win; ties go to the older show.
 */
export function onThisDay(shows: Show[], today = todayISO()): Memory | null {
  const [ty, tm, td] = today.split("-").map(Number);
  const doy = dayOfYear(tm, td);

  let best: Memory | null = null;
  for (const s of shows) {
    if (s.show_date >= today) continue;
    const [sy, sm, sd] = s.show_date.split("-").map(Number);
    const yearsAgo = ty - sy;
    if (yearsAgo < 1) continue;
    // Distance between month-days, wrapping around new year.
    const diff = Math.abs(dayOfYear(sm, sd) - doy);
    const distance = Math.min(diff, 365 - diff);
    if (distance > 3) continue;
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && yearsAgo > best.yearsAgo)
    ) {
      best = { show: s, yearsAgo, distance };
    }
  }
  return best;
}

function dayOfYear(month: number, day: number): number {
  const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return CUM[month - 1] + day;
}
