import type { Metadata } from "next";
import { DemoTimeline } from "@/components/DemoLocalMerge";

export const metadata: Metadata = {
  title: "Concert Map — Demo timeline",
};

export default function DemoTimelinePage() {
  return <DemoTimeline />;
}
