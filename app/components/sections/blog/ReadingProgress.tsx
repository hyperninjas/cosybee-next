"use client";

import { useEffect, useState } from "react";

/** Thin progress bar fixed to the top, tracking page scroll depth. */
export default function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-[#E52D2D] via-[#D25116] to-[#D86813] transition-[width] duration-75"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
