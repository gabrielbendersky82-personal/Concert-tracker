"use client";

import Link from "next/link";
import { NavIcon, type Section } from "./AppNav";
import BrandMark from "./BrandMark";

const DEMO_SECTIONS: { id: Section; label: string; href: string }[] = [
  { id: "map", label: "Map", href: "/demo" },
  { id: "timeline", label: "Timeline", href: "/demo/timeline" },
  { id: "dashboard", label: "Dashboard", href: "/demo/dashboard" },
];

/**
 * Top bar for logged-out visitors (the public demo and public profiles).
 * Shows the wordmark, an optional demo section nav, and a "Sign in" CTA — no
 * account menu. `showSections` turns on the Map/Timeline/Dashboard demo tabs
 * (with a matching mobile bottom bar); `notice` renders a thin banner line.
 */
export default function GuestBar({
  active,
  showSections = false,
  notice,
}: {
  active?: Section;
  showSections?: boolean;
  notice?: string;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href={showSections ? "/demo" : "/"} className="flex items-center gap-2">
            <BrandMark className="h-8 w-8" />
            <span className="hidden text-sm font-semibold tracking-tight text-slate-900 sm:inline">
              Concert Map
            </span>
          </Link>

          {showSections && (
            <nav className="hidden items-center gap-1 md:flex">
              {DEMO_SECTIONS.map((s) => {
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
          )}

          <Link
            href="/login"
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Sign in
          </Link>
        </div>

        {notice && (
          <div className="border-t border-indigo-100 bg-indigo-50/70 px-4 py-1.5 text-center text-xs text-indigo-700 sm:px-6">
            {notice}
          </div>
        )}
      </header>

      {showSections && (
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
          {DEMO_SECTIONS.map((s) => {
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
      )}
    </>
  );
}
