"use client";

import { useEffect, useState } from "react";
import TimelineView from "./TimelineView";
import DashboardView from "./DashboardView";
import WrappedStory from "./WrappedStory";
import EntityView from "./EntityView";
import { loadDemoLocalShows } from "@/lib/demoLocal";
import { DEMO_HANDLE, DEMO_PEOPLE } from "@/lib/demoShows";
import type { Show } from "@/lib/types";

/**
 * Demo timeline/dashboard wrappers: render the demo dataset (the owner's live
 * shows + curated friends, resolved server-side) first, then merge in any
 * shows this visitor added (browser-local) after mount, so their additions
 * follow them across every demo view.
 */
function useDemoShows(initial: Show[]): Show[] {
  const [shows, setShows] = useState<Show[]>(initial);
  useEffect(() => {
    const local = loadDemoLocalShows();
    if (local.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShows([...local, ...initial]);
    }
  }, [initial]);
  return shows;
}

export function DemoTimeline({ initialShows }: { initialShows: Show[] }) {
  return (
    <TimelineView
      shows={useDemoShows(initialShows)}
      handle={DEMO_HANDLE}
      guest
      attendees={DEMO_PEOPLE}
      myId="you"
    />
  );
}

export function DemoDashboard({ initialShows }: { initialShows: Show[] }) {
  return (
    <DashboardView
      shows={useDemoShows(initialShows)}
      handle={DEMO_HANDLE}
      guest
      attendees={DEMO_PEOPLE}
      myId="you"
    />
  );
}

export function DemoEntity({
  kind,
  name,
  initialShows,
}: {
  kind: "artist" | "venue";
  name: string;
  initialShows: Show[];
}) {
  return (
    <EntityView
      kind={kind}
      name={name}
      shows={useDemoShows(initialShows)}
      handle={DEMO_HANDLE}
      guest
      attendees={DEMO_PEOPLE}
      myId="you"
    />
  );
}

export function DemoWrapped({ initialShows }: { initialShows: Show[] }) {
  // Wrapped is personal — the demo wraps the "you" persona's shows
  // (live history + anything this visitor added locally).
  const shows = useDemoShows(initialShows).filter((s) => s.user_id === "you");
  return <WrappedStory shows={shows} handle={DEMO_HANDLE} guest />;
}
