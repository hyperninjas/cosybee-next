/** Which curve maps a flow's magnitude onto the travel time of its dot. */
export type FlowRateModel =
  /**
   * Proportional: every flow is scaled against the LARGEST flow in the current
   * frame, so the biggest contributor always animates at `minDurationMs` and the
   * rest fan out below it.
   *
   * 🔴 The default, and a deliberate departure from the Flutter package, whose
   * default is `absolute`. Measured on a real kilowatt system — flows of 0.80,
   * 1.40 and 3.20 kW — `absolute` returns 5998 ms, 5996 ms and 5992 ms: a **6 ms
   * spread across a 4x difference in flow**. Every dot crawls identically and
   * the animation conveys nothing about magnitude.
   *
   * The cause is that `absolute` maps against `maxExpected`, which defaults to
   * 2000 because the reference card was tuned for WATT-HOURS. Anyone passing
   * kilowatts — which `kilowattsFormat` exists to support — gets a dead
   * animation, and nothing in the API connects the two settings.
   *
   * `proportional` has no expected range to get wrong, so it is correct at any
   * unit and any scale. Pass `absolute` for byte-identical Flutter behaviour.
   */
  | "proportional"
  /**
   * Absolute: the value is mapped from an expected range onto the duration
   * range, so a given reading always animates at the same speed regardless of
   * what the other flows are doing. The reference card's default.
   */
  | "absolute"
  /**
   * Relative: the value is scaled against the sum of all flows, so the fastest
   * dot is always the largest contributor in the current frame.
   */
  | "relative";

/**
 * Maps flow magnitudes onto dot travel durations.
 *
 * Faster flows get *shorter* durations, so `minDurationMs` corresponds to the
 * largest expected reading.
 */
export interface FlowRate {
  readonly model: FlowRateModel;
  /** Travel time for a flow at or above `maxExpected` — the fastest dot. */
  readonly minDurationMs: number;
  /** Travel time for a flow at or below `minExpected` — the slowest dot. */
  readonly maxDurationMs: number;
  /** The reading that maps to `minDurationMs` in the absolute model. */
  readonly minExpected: number;
  /** The reading that maps to `maxDurationMs` in the absolute model. */
  readonly maxExpected: number;
}

export const DEFAULT_FLOW_RATE: FlowRate = {
  model: "proportional",
  minDurationMs: 750,
  maxDurationMs: 6000,
  minExpected: 0.01,
  maxExpected: 2000,
};

/**
 * Computes the dot travel time for `value`, in milliseconds.
 *
 * `total` is the sum of every flow in the diagram, consulted by `relative`.
 * `peak` is the largest single flow, consulted by `proportional`; it falls back
 * to `total` so a caller that only has one of the two still gets a sane answer.
 */
export function durationFor(rate: FlowRate, value: number, total = 0, peak = 0): number {
  const safeValue = Number.isFinite(value) ? Math.max(value, 0) : 0;
  // A caller can hand us anything; a non-finite bound would make every duration
  // NaN, and an `animation-duration: NaNms` simply never runs.
  const minSeconds = Number.isFinite(rate.minDurationMs) ? rate.minDurationMs / 1000 : 0.75;
  const maxSeconds = Number.isFinite(rate.maxDurationMs) ? rate.maxDurationMs / 1000 : 6;

  let seconds: number;
  if (rate.model === "proportional") {
    // Scale against the largest flow on screen, so the fastest dot is always
    // the biggest contributor whatever unit the readings are in.
    const reference = peak > 0 ? peak : total > 0 ? total : safeValue;
    const share = reference > 0 ? Math.min(safeValue / reference, 1) : 0;
    seconds = maxSeconds - share * (maxSeconds - minSeconds);
  } else if (rate.model === "absolute") {
    if (safeValue > rate.maxExpected) {
      seconds = minSeconds;
    } else {
      const span = rate.maxExpected - rate.minExpected;
      seconds =
        span === 0
          ? maxSeconds
          : ((safeValue - rate.minExpected) * (minSeconds - maxSeconds)) / span + maxSeconds;
    }
  } else {
    const denominator = total > 0 ? total : safeValue > 0 ? safeValue : 1;
    seconds = maxSeconds - (safeValue / denominator) * (maxSeconds - minSeconds);
  }

  if (!Number.isFinite(seconds)) seconds = maxSeconds;
  // The reference model extrapolates below `minExpected`, which sends the
  // duration towards infinity as the value approaches zero. Clamping keeps
  // near-zero flows visibly animating.
  // `min`/`max` may be supplied the wrong way round; clamping to the ordered
  // pair means a mistake slows the dot rather than producing a negative
  // duration, which browsers treat as "no animation at all".
  const lo = Math.min(minSeconds, maxSeconds);
  const hi = Math.max(minSeconds, maxSeconds);
  seconds = Math.min(Math.max(seconds, lo), hi);
  return Math.max(1, Math.round(seconds * 1000));
}

/** Linear interpolation helper, exposed for tests. */
export function mapRange(
  value: number,
  minOut: number,
  maxOut: number,
  minIn: number,
  maxIn: number,
): number {
  if (value > maxIn) return maxOut;
  if (maxIn === minIn) return minOut;
  return ((value - minIn) * (maxOut - minOut)) / (maxIn - minIn) + minOut;
}
