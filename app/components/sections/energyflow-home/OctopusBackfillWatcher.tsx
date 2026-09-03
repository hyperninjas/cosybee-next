"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Silent auto-refresh for the Octopus back-fill window.
 *
 * When a customer freshly links Octopus, the backend fires a fire-and-forget
 * history import (up to 24 months of half-hourly usage + costs) and the
 * connection status returns `backfillComplete: false` until it lands. The
 * ProviderStatusBar tile displays "Back-filling your history…" during that
 * window; once the flag flips to `true`, the tile switches to
 * `Account A-XXXXXXXX` and the dashboard's cost tiles / stats fill in.
 *
 * Without polling, that flip only happens on a manual page reload —
 * customers watch "Back-filling…" indefinitely because we never re-check.
 * This component runs while the flag is false, calls `router.refresh()` on
 * an interval, and self-terminates the moment the parent's next render
 * comes back with `isBackfilling === false`.
 *
 * Renders nothing — it's a behaviour-only component.
 *
 * ### Interval choice
 *
 * Default is 20 s: Octopus back-fills complete in 30–90 s for a typical
 * account. Faster than SyncingDataBanner's 45 s (which is for the slower
 * Sunsynk intraday backfill) so the UI feels responsive. Configurable in
 * case a specific customer profile needs tuning.
 */

interface Props {
  /**
   * True while Octopus is `connected` but `backfillComplete === false`.
   * The parent computes this from the connection state.
   */
  isBackfilling: boolean;
  /** Milliseconds between silent refreshes. */
  intervalMs?: number;
}

export function OctopusBackfillWatcher({
  isBackfilling,
  intervalMs = 20_000,
}: Props) {
  const router = useRouter();
  // Track the current interval so we don't overlap timers across renders
  // when the prop toggles quickly (e.g. hydration + a fast first refresh).
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isBackfilling) return;
    timerRef.current = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isBackfilling, intervalMs, router]);

  return null;
}
