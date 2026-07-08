"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
        className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 transition hover:bg-slate-50"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {handle.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm font-medium text-slate-700 sm:inline">
          @{handle}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-xs text-slate-400">@{handle}</div>
          <Link
            href={`/u/${handle}`}
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Your profile
          </Link>
          <button
            onClick={signOut}
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
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
      } inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden`}
    >
      {SECTIONS.map((s) => {
        const on = s.id === active;
        return (
          <Link
            key={s.id}
            href={s.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
              on ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
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
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg text-base"
              style={{ background: "linear-gradient(150deg,#818cf8,#ec4899)" }}
            >
              📍
            </span>
            <span className="hidden text-sm font-semibold tracking-tight text-slate-900 sm:inline">
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
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    on
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <NavIcon id={s.id} className="h-4 w-4" />
                  {s.label}
                </Link>
              );
            })}
          </nav>

          <AccountMenu handle={handle} />
        </div>
      </header>

      <BottomTabs active={active} />
    </>
  );
}
