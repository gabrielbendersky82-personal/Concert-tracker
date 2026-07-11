import type { MetadataRoute } from "next";

// Web app manifest: makes the site installable ("Add to Home Screen") as a
// standalone full-screen app with the brand pin icon. Purely additive — the
// URL-based site is unchanged for browser visitors.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Concert Map",
    short_name: "Concert Map",
    description: "A personal map of every concert you've been to.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#15151c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
