import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import GuestBar from "@/components/GuestBar";

export const metadata: Metadata = {
  title: "The story behind Concert Map",
  description:
    "Why I built Concert Map — the shows that shaped my life, and the memories I wanted to map and share.",
};

// Subtle inline emphasis so artist names pop within the flowing prose.
function Artist({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-ink">{children}</span>;
}

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-ground">
      <GuestBar />

      {/* Photo header — dissolves into the page ground in both themes */}
      <header className="relative overflow-hidden">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-ground" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            The story behind Concert Map
          </p>
          <h1
            className="mt-3 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.55)" }}
          >
            I remember my life in shows.
          </h1>
        </div>
      </header>

      {/* Story */}
      <div className="mx-auto max-w-2xl px-6 pb-24">
        <div className="space-y-5 pt-12 text-lg leading-relaxed text-ink-2">
          <p>
            Music is a huge part of who I am. When I look back, I don&apos;t
            measure the years by dates or jobs or addresses — I measure them by
            the shows I was at, and who I was with.
          </p>
          <p>
            Some nights are burned in for good. I turned 21 at Madison Square
            Garden watching <Artist>Neil Young</Artist>, exactly where I wanted
            to be. I saw <Artist>Sonic Youth</Artist> and{" "}
            <Artist>Iggy Pop</Artist> share a single bill and level the room, and
            heard <Artist>Sigur Rós</Artist> play what I can only describe as
            music from heaven. <Artist>My Bloody Valentine</Artist> made a whole
            year of mine bleed out in the most blissful joy. After years of
            waiting, I finally caught <Artist>Radiohead</Artist>
            {" — "}at home, in Tel Aviv. And I&apos;ll never forget standing on
            stage with{" "}
            <Artist>Nick Cave</Artist> at Primavera Sound in Barcelona, in front
            of fifty thousand people, completely and utterly blown away.
          </p>
          <p>
            …and dozens more. Some I saw on my own; most I shared with friends.
            These are the milestones that shaped me — the nights I keep coming
            back to, the ones that made me who I am today.
          </p>
          <p>
            That&apos;s why I built Concert Map: to pin these memories to the
            places they happened, to relive the gigs I shared with friends, and
            to keep documenting my journey as a music lover — one show at a time.
          </p>
        </div>

        <p className="mt-8 text-base font-semibold text-ink">— Gaby</p>

        {/* CTA */}
        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-1 rounded-full bg-cta px-6 py-3 text-sm font-semibold text-cta-ink transition hover:opacity-90"
          >
            Explore the live demo
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1 rounded-full border border-line-2 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-raised"
          >
            Build your own map
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
