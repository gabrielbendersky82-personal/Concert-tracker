import type { Metadata } from "next";
import DashboardView from "@/components/DashboardView";
import { computeDashboard } from "@/lib/stats";
import { DEMO_HANDLE, DEMO_PEOPLE, DEMO_SHOWS } from "@/lib/demoShows";

export const metadata: Metadata = {
  title: "Concert Map — Demo dashboard",
};

// Count shows per persona for the "Who went" card.
const attendeeBreakdown = DEMO_PEOPLE.map((p) => ({
  label: p.label,
  color: p.color,
  count: DEMO_SHOWS.filter((s) => s.user_id === p.id).length,
})).sort((a, b) => b.count - a.count);

export default function DemoDashboardPage() {
  return (
    <DashboardView
      data={computeDashboard(DEMO_SHOWS)}
      handle={DEMO_HANDLE}
      guest
      attendeeBreakdown={attendeeBreakdown}
    />
  );
}
