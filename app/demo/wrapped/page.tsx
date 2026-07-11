import type { Metadata } from "next";
import { DemoWrapped } from "@/components/DemoLocalMerge";

export const metadata: Metadata = {
  title: "Concert Map — Demo wrapped",
  description: "A year in live music, wrapped — demo.",
};

export default function DemoWrappedPage() {
  return <DemoWrapped />;
}
