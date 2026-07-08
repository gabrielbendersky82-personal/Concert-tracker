import type { Metadata } from "next";
import DashboardView from "@/components/DashboardView";
import { computeDashboard } from "@/lib/stats";
import { DEMO_HANDLE, DEMO_SHOWS } from "@/lib/demoShows";

export const metadata: Metadata = {
  title: "Concert Map — Demo dashboard",
};

export default function DemoDashboardPage() {
  return (
    <DashboardView
      data={computeDashboard(DEMO_SHOWS)}
      handle={DEMO_HANDLE}
      guest
    />
  );
}
