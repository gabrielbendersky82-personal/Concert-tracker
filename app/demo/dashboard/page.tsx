import type { Metadata } from "next";
import { DemoDashboard } from "@/components/DemoLocalMerge";
import { loadDemoShows } from "@/lib/demoLive";

export const metadata: Metadata = {
  title: "Concert Map — Demo dashboard",
};

export default async function DemoDashboardPage() {
  return <DemoDashboard initialShows={await loadDemoShows()} />;
}
