import type { Metadata } from "next";
import ConcertApp from "@/components/ConcertApp";
import { DEMO_HANDLE, DEMO_PEOPLE, DEMO_SHOWS } from "@/lib/demoShows";

export const metadata: Metadata = {
  title: "Concert Map — Live demo",
  description:
    "Explore Concert Map with sample data — no account needed. A map of every show, a timeline, and a stats dashboard.",
};

// Public, read-only demo. No auth: renders curated in-memory shows, framed as a
// shared map (You + Maya + Leo) with pins color-coded by who attended.
export default function DemoPage() {
  return (
    <ConcertApp
      handle={DEMO_HANDLE}
      readOnly
      initialShows={DEMO_SHOWS}
      attendees={DEMO_PEOPLE}
      myId="you"
    />
  );
}
