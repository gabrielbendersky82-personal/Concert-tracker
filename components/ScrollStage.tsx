"use client";

import { useEffect, useRef } from "react";
import ConcertApp from "./ConcertApp";
import Hero from "./Hero";

/**
 * Scroll-linked crossfade: the map sits fixed full-screen, the hero is layered
 * on top, and its opacity tracks scroll position — so scrolling fades the photo
 * out in real time to reveal the map beneath. A tall spacer supplies the scroll
 * distance; once the hero has faded it stops intercepting pointer events.
 */
export default function ScrollStage({
  email,
  count,
}: {
  email: string;
  count: number;
}) {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const progress = Math.min(1, window.scrollY / window.innerHeight);
      const el = heroRef.current;
      if (el) {
        el.style.opacity = String(1 - progress);
        el.style.pointerEvents = progress > 0.5 ? "none" : "auto";
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const open = () =>
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });

  return (
    <>
      {/* Map/app, fixed full-screen behind the hero */}
      <div className="fixed inset-0 z-10">
        <ConcertApp userEmail={email} />
      </div>

      {/* Hero, faded out by scroll */}
      <div ref={heroRef} className="fixed inset-0 z-20 will-change-[opacity]">
        <Hero email={email} count={count} onOpen={open} />
      </div>

      {/* Scroll driver: one viewport of scroll powers the full crossfade */}
      <div aria-hidden className="h-[200vh]" />
    </>
  );
}
