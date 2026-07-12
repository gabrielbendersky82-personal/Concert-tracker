import type { Metadata } from "next";
import { DemoWrapped } from "@/components/DemoLocalMerge";
import { loadDemoShows } from "@/lib/demoLive";

export const metadata: Metadata = {
  title: "Concert Map — Demo wrapped",
  description: "A year in live music, wrapped — demo.",
};

export default async function DemoWrappedPage() {
  return <DemoWrapped initialShows={await loadDemoShows()} />;
}
