import type { Metadata } from "next";
import ConcertApp from "@/components/ConcertApp";
import { DEMO_HANDLE, DEMO_SHOWS } from "@/lib/demoShows";

export const metadata: Metadata = {
  title: "Concert Map — Live demo",
  description:
    "Explore Concert Map with sample data — no account needed. A map of every show, a timeline, and a stats dashboard.",
};

// Public, read-only demo. No auth: renders curated in-memory shows.
export default function DemoPage() {
  return <ConcertApp handle={DEMO_HANDLE} readOnly initialShows={DEMO_SHOWS} />;
}
