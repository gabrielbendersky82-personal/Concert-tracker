import { ImageResponse } from "next/og";
import { loadDemoShows } from "@/lib/demoLive";
import { OG_SIZE, ogCard, showStats } from "@/lib/ogCard";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Concert Map — live demo";

export default async function Image() {
  return new ImageResponse(
    ogCard({
      eyebrow: "Live demo",
      title: "Every show, pinned to the place it happened.",
      subtitle: "Explore a real concert history — no sign-in needed.",
      stats: showStats(await loadDemoShows()),
    }),
    size
  );
}
