"use client";
// React Compiler opt-out for the whole file: with compilationMode "all" the
// compiler instruments module-level helpers with useMemoCache, and
// useSyncExternalStore invokes subscribe/getSnapshot OUTSIDE render — the
// injected hook call then throws "Invalid hook call". Nothing here benefits
// from memoization, so skip compilation entirely.
"use no memo";

import { useSyncExternalStore } from "react";

export type DevicePlatform = "ios" | "android" | "desktop";

// useSyncExternalStore plumbing: the UA never changes during a session, so
// subscribe is a no-op and the snapshot is recomputed on demand — string
// snapshots compare by value, so the result is render-stable.
function subscribe() {
  return () => {};
}

function getSnapshot(): DevicePlatform {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a desktop Mac UA — the touch-points check catches it.
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  return isIos ? "ios" : /Android/i.test(ua) ? "android" : "desktop";
}

function getServerSnapshot(): null {
  return null;
}

/**
 * Detects the visitor's platform from the user agent.
 *
 * Returns `null` on the server and during hydration, so SSR output stays
 * platform-neutral (crawlers and no-JS visitors see every option). Branch on
 * the value to *enhance* the neutral layout — highlight, reorder, relabel —
 * never to hide whole alternatives.
 */
export function useDevicePlatform(): DevicePlatform | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
