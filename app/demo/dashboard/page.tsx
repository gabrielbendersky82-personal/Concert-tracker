import type { Metadata } from "next";
import { DemoDashboard } from "@/components/DemoLocalMerge";

export const metadata: Metadata = {
  title: "Concert Map — Demo dashboard",
};

export default function DemoDashboardPage() {
  return <DemoDashboard />;
}
