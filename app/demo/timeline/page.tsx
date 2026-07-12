import type { Metadata } from "next";
import { DemoTimeline } from "@/components/DemoLocalMerge";
import { loadDemoShows } from "@/lib/demoLive";

export const metadata: Metadata = {
  title: "Concert Map — Demo timeline",
};

export default async function DemoTimelinePage() {
  return <DemoTimeline initialShows={await loadDemoShows()} />;
}
