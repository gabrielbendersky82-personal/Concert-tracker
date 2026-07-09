import type { Metadata } from "next";
import DashboardView from "@/components/DashboardView";
import { DEMO_HANDLE, DEMO_PEOPLE, DEMO_SHOWS } from "@/lib/demoShows";

export const metadata: Metadata = {
  title: "Concert Map — Demo dashboard",
};

export default function DemoDashboardPage() {
  return (
    <DashboardView
      shows={DEMO_SHOWS}
      handle={DEMO_HANDLE}
      guest
      attendees={DEMO_PEOPLE}
      myId="you"
    />
  );
}
