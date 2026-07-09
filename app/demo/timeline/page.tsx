import type { Metadata } from "next";
import TimelineView from "@/components/TimelineView";
import { DEMO_HANDLE, DEMO_PEOPLE, DEMO_SHOWS } from "@/lib/demoShows";

export const metadata: Metadata = {
  title: "Concert Map — Demo timeline",
};

export default function DemoTimelinePage() {
  return (
    <TimelineView
      shows={DEMO_SHOWS}
      handle={DEMO_HANDLE}
      guest
      attendees={DEMO_PEOPLE}
    />
  );
}
