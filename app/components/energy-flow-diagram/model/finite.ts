/**
 * Boundary guards, so one bad number cannot empty the diagram.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHY THIS EXISTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Neither the Flutter package nor the reference card guards its inputs, and
 * both inherit the same hole: `Infinity` or `NaN` in a reading propagates
 * through the allocator into every derived figure, into the layout, and finally
 * into an SVG `d` attribute. A path whose `d` contains `NaN` does not draw a
 * broken line — the browser silently renders NOTHING, so a single bad field
 * takes the whole diagram with it and leaves no error behind to explain it.
 *
 * That is reachable from ordinary data: a division by a zero denominator
 * upstream, a JSON `null` coerced with `Number()`, a sensor reporting a sentinel.
 *
 * So every number entering the package is passed through here. A non-finite
 * reading is treated as ABSENT rather than as zero wherever the distinction
 * exists, because "we did not get a number" and "the value is zero" are
 * different claims — the same rule the rest of this codebase applies.
 */

/** `value` when it is a usable number, otherwise `fallback`. */
export function finite(value: number | undefined | null, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** `value` when it is a usable number, otherwise `undefined` — absent stays absent. */
export function finiteOrUndefined(value: number | undefined | null): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** `value` clamped into `[min, max]`, with non-finite input falling back. */
export function clampFinite(
  value: number | undefined | null,
  min: number,
  max: number,
  fallback: number,
): number {
  const v = finite(value, fallback);
  return Math.min(Math.max(v, min), max);
}

/** A dimension that must be positive: non-finite or <= 0 falls back. */
export function positive(value: number | undefined | null, fallback: number): number {
  const v = finite(value, fallback);
  return v > 0 ? v : fallback;
}

/** A dimension that must not be negative. */
export function nonNegative(value: number | undefined | null, fallback: number): number {
  const v = finite(value, fallback);
  return v >= 0 ? v : fallback;
}

/** True when every coordinate in an SVG path is a real number. */
export function pathIsFinite(d: string): boolean {
  return d.length > 0 && !/NaN|Infinity/.test(d);
}

/**
 * Rounds a coordinate for emission into a path.
 *
 * Sub-pixel precision beyond two decimals is invisible at every size this
 * package draws at, and trimming it keeps the `d` attributes short and stable —
 * a path that differs only in float noise between renders would otherwise churn
 * the DOM and restart anything animating along it.
 */
export function coord(n: number): number {
  return Math.round(n * 100) / 100;
}
