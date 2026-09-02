"use client";
"use no memo";

import { useEffect, useState, type RefObject } from "react";

/**
 * The element's content width, or `undefined` until it has been measured.
 *
 * Stands in for Flutter's `LayoutBuilder`. Callers fall back to
 * `nodeSize.width * 4` while this is undefined, exactly as the Dart widget does
 * for an unbounded constraint.
 */
export function useMeasuredWidth(ref: RefObject<HTMLElement | null>): number | undefined {
  const [width, setWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Absent in jsdom and in older browsers: fall back to a single measurement
    // so the diagram still lays out rather than rendering at the placeholder
    // width forever.
    if (typeof ResizeObserver !== "function") {
      setWidth(element.getBoundingClientRect().width || undefined);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const next = entry.contentRect.width;
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width || undefined);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
