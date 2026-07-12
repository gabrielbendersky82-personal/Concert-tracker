import type { Metadata } from "next";
import ConcertApp from "@/components/ConcertApp";
import { loadDemoShows } from "@/lib/demoLive";
import { DEMO_HANDLE, DEMO_PEOPLE } from "@/lib/demoShows";

export const metadata: Metadata = {
  title: "Concert Map — Live demo",
  description:
    "Explore Concert Map with sample data — no account needed. A map of every show, a timeline, and a stats dashboard.",
};

// Public, read-only demo. No auth: "You" mirrors the owner's live account
// (anon read via the public-profile RLS, cached hourly, static seed as
// fallback), framed as a shared map (You + Maya + Leo) with pins color-coded
// by who attended.
export default async function DemoPage() {
  return (
    <ConcertApp
      handle={DEMO_HANDLE}
      readOnly
      initialShows={await loadDemoShows()}
      attendees={DEMO_PEOPLE}
      myId="you"
    />
  );
}
