import { ImageResponse } from "next/og";
import { OG_SIZE, ogCard } from "@/lib/ogCard";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "The story behind Concert Map";

export default async function Image() {
  return new ImageResponse(
    ogCard({
      eyebrow: "The story behind Concert Map",
      title: "I remember my life in shows.",
      subtitle:
        "Why I built a map for concert memories, and the nights that shaped it.",
    }),
    size
  );
}
