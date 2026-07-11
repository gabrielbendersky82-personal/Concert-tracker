"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "./BrandMark";
import ThemeToggle from "./ThemeToggle";

export type Section = "map" | "timeline" | "dashboard" | "friends";

export const SECTIONS: { id: Section; label: string; href: string }[] = [
  { id: "map", label: "Map", href: "/" },
  { id: "timeline", label: "Timeline", href: "/timeline" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "friends", label: "Friends", href: "/friends" },
];

export function NavIcon({ id, className }: { id: Section; className?: string }) {
  const common = {
    className: className ?? "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "map":
      return (
        <svg {...common}>
          <path d="M12 21s-6-5.4-6-10a6 6 0 1112 0c0 4.6-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      );
    case "timeline":
      return (
        <svg {...common}>
          <path d="M3 12h4l3-7 4 14 3-7h4" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 20V12M10 20V5M16 20v-6M22 20H2" />
        </svg>
      );
    case "friends":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 20a6.5 6.5 0 0113 0" />
          <path d="M16 5.5a3.2 3.2 0 010 5.6M21.5 20a6.5 6.5 0 00-4.5-6.2" />
        </svg>
      );
  }
}

export function AccountMenu({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 transition hover:bg-raised"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-600 dark:text-indigo-300">
          {handle.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm font-medium text-ink-2 sm:inline">
          @{handle}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
          <div className="px-3 py-2 text-xs text-ink-3">@{handle}</div>
          <Link
            href={`/u/${handle}`}
            className="block px-3 py-2 text-sm text-ink-2 hover:bg-raised"
            onClick={() => setOpen(false)}
          >
            Your profile
          </Link>
          <button
            onClick={signOut}
            className="block w-full px-3 py-2 text-left text-sm text-ink-2 hover:bg-raised"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function BottomTabs({
  active,
  position = "fixed",
}: {
  active: Section;
  position?: "fixed" | "absolute";
}) {
  return (
    <nav
      className={`${
        position === "fixed" ? "fixed" : "absolute"
      } inset-x-0 bottom-0 z-[1100] flex border-t border-line bg-surface/95 backdrop-blur md:hidden`}
    >
      {SECTIONS.map((s) => {
        const on = s.id === active;
        return (
          <Link
            key={s.id}
            href={s.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
              on ? "text-accent" : "text-ink-3 hover:text-ink-2"
            }`}
          >
            <NavIcon id={s.id} className="h-5 w-5" />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppNav({
  active,
  handle,
}: {
  active: Section;
  handle: string;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark className="h-8 w-8" />
            <span className="hidden text-sm font-bold tracking-tight text-ink sm:inline">
              Concert Map
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {SECTIONS.map((s) => {
              const on = s.id === active;
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-accent font-semibold text-ink"
                      : "border-transparent font-medium text-ink-2 hover:text-ink"
                  }`}
                >
                  <NavIcon id={s.id} className="h-4 w-4" />
                  {s.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AccountMenu handle={handle} />
          </div>
        </div>
      </header>

      <BottomTabs active={active} />
    </>
  );
}
