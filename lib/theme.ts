"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // storage unavailable (private mode) — theme still applies for the session
  }
  window.dispatchEvent(new Event("themechange"));
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {}
    // Follow the OS only while the user hasn't made an explicit choice.
    if (stored !== "light" && stored !== "dark") {
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    }
    onChange();
  };
  media.addEventListener("change", onMedia);
  window.addEventListener("themechange", onChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onMedia);
    window.removeEventListener("themechange", onChange);
  };
}

// Reactive theme for client components (e.g. MapView tile switching).
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
}
