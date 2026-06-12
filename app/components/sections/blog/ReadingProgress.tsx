"use client";

import { useEffect, useState } from "react";

/**
 * Thin progress bar fixed to the top, tracking scroll depth **through a target
 * element** (the article body) rather than the whole document — so the nav
 * above and the footer / related-posts below don't count toward "read".
 *
 * Pass a `targetSelector`; if it resolves to nothing it falls back to whole-
 * page scroll, so the bar always works.
 */
export default function ReadingProgress({
  targetSelector,
}: {
  /** CSS selector for the element to measure (e.g. the `<article>`). */
  targetSelector?: string;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const target = targetSelector
      ? document.querySelector<HTMLElement>(targetSelector)
      : null;

    let raf = 0;
    function update() {
      if (target) {
        const rect = target.getBoundingClientRect();
        // Readable range = how far you scroll while the article is in view
        // (its height minus one viewport). `-rect.top` is how far the article's
        // top has passed above the viewport top.
        const range = rect.height - window.innerHeight;
        const scrolled = -rect.top;
        const next = range > 0 ? (scrolled / range) * 100 : scrolled >= 0 ? 100 : 0;
        setPct(Math.min(100, Math.max(0, next)));
      } else {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        setPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
      }
    }
    function onScroll() {
      // Coalesce bursts of scroll events into one paint-aligned update.
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetSelector]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-linear-to-r from-[#E52D2D] via-[#D25116] to-[#D86813]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
