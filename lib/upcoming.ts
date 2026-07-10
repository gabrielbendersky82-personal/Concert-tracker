import type { Show } from "./types";

/** Today's date as YYYY-MM-DD (local time). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isUpcoming(show: Show, today = todayISO()): boolean {
  return show.show_date > today;
}

/** Whole days from today until an ISO date (1 = tomorrow). */
export function daysUntil(date: string, today = todayISO()): number {
  const ms =
    new Date(`${date}T00:00:00`).getTime() -
    new Date(`${today}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/** Human label for a future date: "tonight", "tomorrow", "in 12 days". */
export function untilLabel(date: string, today = todayISO()): string {
  const days = daysUntil(date, today);
  if (days <= 0) return "tonight";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/** The soonest future show, or null. */
export function nextUpcoming(shows: Show[], today = todayISO()): Show | null {
  let best: Show | null = null;
  for (const s of shows) {
    if (!isUpcoming(s, today)) continue;
    if (!best || s.show_date < best.show_date) best = s;
  }
  return best;
}
