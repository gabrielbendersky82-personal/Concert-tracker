"use client";

import { useEffect, useState } from "react";
import TimelineView from "./TimelineView";
import DashboardView from "./DashboardView";
import { loadDemoLocalShows } from "@/lib/demoLocal";
import { DEMO_HANDLE, DEMO_PEOPLE, DEMO_SHOWS } from "@/lib/demoShows";
import type { Show } from "@/lib/types";

/**
 * Demo timeline/dashboard wrappers: render the curated demo set on the
 * server, then merge in any shows this visitor added (browser-local) after
 * mount, so their additions follow them across every demo view.
 */
function useDemoShows(): Show[] {
  const [shows, setShows] = useState<Show[]>(DEMO_SHOWS);
  useEffect(() => {
    const local = loadDemoLocalShows();
    if (local.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShows([...local, ...DEMO_SHOWS]);
    }
  }, []);
  return shows;
}

export function DemoTimeline() {
  return (
    <TimelineView
      shows={useDemoShows()}
      handle={DEMO_HANDLE}
      guest
      attendees={DEMO_PEOPLE}
      myId="you"
    />
  );
}

export function DemoDashboard() {
  return (
    <DashboardView
      shows={useDemoShows()}
      handle={DEMO_HANDLE}
      guest
      attendees={DEMO_PEOPLE}
      myId="you"
    />
  );
}
