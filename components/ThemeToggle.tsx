"use client";

import { getTheme, setTheme } from "@/lib/theme";

// Sun/moon theme switch. Both icons are always rendered and shown/hidden with
// the dark: variant so SSR markup never depends on the client theme (no
// hydration mismatch, no mount flicker).
export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title="Toggle light / dark"
      onClick={() => setTheme(getTheme() === "dark" ? "light" : "dark")}
      className={`grid h-8 w-8 place-items-center rounded-full border border-line text-ink-2 transition hover:bg-raised hover:text-ink ${className}`}
    >
      {/* sun — shown in dark mode (click = go light) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="hidden h-4 w-4 dark:block"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* moon — shown in light mode (click = go dark) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 dark:hidden"
        aria-hidden
      >
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
    </button>
  );
}
