"use client";
"use no memo";

import { useEffect, useRef, useState } from "react";
import { EMPTY_RING, lerpRing, type HomeRingShares } from "../model/solution";

/** `Curves.easeOutCubic`, the curve the Flutter widget morphs the ring with. */
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const ringKey = (r: HomeRingShares): string =>
  `${r.grid.toFixed(6)}:${r.lowCarbon.toFixed(6)}:${r.battery.toFixed(6)}:${r.solar.toFixed(6)}`;

/**
 * Morphs the home ring towards `target` instead of letting it jump.
 *
 * The equivalent of the Dart `TweenAnimationBuilder<HomeRingShares>` +
 * `HomeRingSharesTween`: it re-bases on whatever is currently on screen when a
 * new target arrives, so a reading that changes mid-transition continues from
 * where the ring actually is rather than restarting from the previous target.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 THE REF IS WRITTEN FROM THE ANIMATION, NOT FROM RENDER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The first version assigned `currentRef.current = shares` in the render body to
 * track what was on screen. That is a render-phase side effect: React may render
 * a component twice without committing (StrictMode does exactly that in
 * development, and concurrent rendering may discard a render entirely), so the
 * ref could be advanced by a render that never reached the DOM — leaving the
 * next transition to interpolate FROM a frame the viewer never saw.
 *
 * The ref is now written only inside the animation callback and the effect, both
 * of which run after commit.
 */
export function useAnimatedRing(target: HomeRingShares, durationMs: number): HomeRingShares {
  const [shares, setShares] = useState<HomeRingShares>(target);
  const onScreen = useRef<HomeRingShares>(target);
  const frame = useRef<number | null>(null);

  const key = ringKey(target);

  useEffect(() => {
    const from = onScreen.current;

    const settle = (): void => {
      onScreen.current = target;
      setShares(target);
    };

    // A non-positive or unusable duration means "no transition", which is a
    // legitimate choice rather than an error.
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      settle();
      return;
    }
    // Absent in some SSR and test environments; the ring lands on its target
    // there rather than throwing or staying blank.
    if (typeof requestAnimationFrame !== "function") {
      settle();
      return;
    }

    const started = typeof performance !== "undefined" ? performance.now() : Date.now();

    const step = (now: number): void => {
      const t = Math.min(1, (now - started) / durationMs);
      const next = t >= 1 ? target : lerpRing(from, target, easeOutCubic(t));
      onScreen.current = next;
      setShares(next);
      if (t < 1) frame.current = requestAnimationFrame(step);
      else frame.current = null;
    };

    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
    // `key` stands in for `target` by value: two separately-constructed objects
    // holding the same four numbers must not restart the transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, durationMs]);

  return shares;
}

export { EMPTY_RING };
