import type { Point } from "../model/types";

/**
 * Measurement and slicing for the SVG paths this package emits.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHY THIS EXISTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The Flutter package leans on `dart:ui`'s `PathMetric` for three things: the
 * perimeter of a node outline, the point a travelling dot has reached, and the
 * `OutlineSlicer` that cuts the consumption ring into segments.
 *
 * At RUNTIME this port needs none of them — the browser measures paths for
 * `stroke-dasharray` and walks them for `animateMotion`. But `getTotalLength`
 * lives on `SVGGeometryElement`, which jsdom does not implement, so without
 * this the geometry could not be tested at all; and the slicer is part of the
 * package's public surface. So the same three operations are provided here,
 * in pure TypeScript, over a flattened form of the path.
 *
 * Every path this package emits uses only `M`, `L`, `Q`, `C` and `Z` — the
 * circle outline is built from cubics precisely so that arc flattening is never
 * needed — which keeps this small enough to be obviously correct.
 */

/** One contour: a run of points, and whether it closes back on itself. */
export interface Contour {
  readonly points: readonly Point[];
  readonly closed: boolean;
}

const DEFAULT_STEPS = 24;

const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

const quadAt = (p0: Point, p1: Point, p2: Point, t: number): Point =>
  lerp(lerp(p0, p1, t), lerp(p1, p2, t), t);

const cubicAt = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  return lerp(lerp(a, b, t), lerp(b, c, t), t);
};

/**
 * Flattens an SVG path into polylines.
 *
 * Absolute commands only, which is all this package emits. `steps` controls how
 * finely curves are subdivided; the default is well past the point where the
 * measured perimeter stops moving at the scales these nodes are drawn at.
 */
export function flattenPath(d: string, steps: number = DEFAULT_STEPS): Contour[] {
  const tokens = d.match(/[MLQCZmlqcz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const contours: Contour[] = [];

  let points: Point[] = [];
  let closed = false;
  let cursor: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };
  let i = 0;

  const flush = (): void => {
    if (points.length > 1) contours.push({ points, closed });
    points = [];
    closed = false;
  };

  const num = (): number => Number(tokens[i++]);

  while (i < tokens.length) {
    const token = tokens[i++]!;
    switch (token.toUpperCase()) {
      case "M": {
        flush();
        cursor = { x: num(), y: num() };
        start = cursor;
        points = [cursor];
        break;
      }
      case "L": {
        cursor = { x: num(), y: num() };
        points.push(cursor);
        break;
      }
      case "Q": {
        const c: Point = { x: num(), y: num() };
        const end: Point = { x: num(), y: num() };
        for (let s = 1; s <= steps; s++) points.push(quadAt(cursor, c, end, s / steps));
        cursor = end;
        break;
      }
      case "C": {
        const c1: Point = { x: num(), y: num() };
        const c2: Point = { x: num(), y: num() };
        const end: Point = { x: num(), y: num() };
        for (let s = 1; s <= steps; s++) points.push(cubicAt(cursor, c1, c2, end, s / steps));
        cursor = end;
        break;
      }
      case "Z": {
        // Close by returning to the contour's start, so the closing edge is
        // measured like any other.
        if (points.length > 0) points.push(start);
        closed = true;
        cursor = start;
        flush();
        break;
      }
      default:
        break;
    }
  }
  flush();
  return contours;
}

/** Total arc length of `d`. The equivalent of summing every `PathMetric.length`. */
export function pathLength(d: string, steps: number = DEFAULT_STEPS): number {
  let total = 0;
  for (const contour of flattenPath(d, steps)) {
    for (let i = 1; i < contour.points.length; i++) {
      total += Math.hypot(
        contour.points[i]!.x - contour.points[i - 1]!.x,
        contour.points[i]!.y - contour.points[i - 1]!.y,
      );
    }
  }
  return total;
}

/**
 * The point at an absolute arc-length offset along `d`, resolved across every
 * contour — the equivalent of `PathMetric.getTangentForOffset().position`.
 */
export function pointAtLength(
  d: string,
  target: number,
  steps: number = DEFAULT_STEPS,
): Point | null {
  const contours = flattenPath(d, steps);
  if (contours.length === 0) return null;

  let remaining = Math.max(0, target);
  let last: Point | null = null;

  for (const contour of contours) {
    for (let i = 1; i < contour.points.length; i++) {
      const a = contour.points[i - 1]!;
      const b = contour.points[i]!;
      const segment = Math.hypot(b.x - a.x, b.y - a.y);
      last = b;
      if (segment <= 0) continue;
      if (remaining <= segment) return lerp(a, b, remaining / segment);
      remaining -= segment;
    }
  }
  return last;
}

/**
 * The portion of `d` running from `start` to `start + fraction`, both as
 * fractions of the total length. Wraps around the end.
 *
 * The direct equivalent of the Dart `OutlineSlicer.slice`. Returns an empty
 * string when `fraction` is not positive — a zero share draws nothing, rather
 * than a degenerate dot.
 */
export function sliceOutline(
  d: string,
  start: number,
  fraction: number,
  steps: number = DEFAULT_STEPS,
): string {
  if (fraction <= 0) return "";
  const total = pathLength(d, steps);
  if (total <= 0) return "";

  const clamped = Math.min(fraction, 1);
  // `%` keeps a negative start negative in JS, unlike Dart's `%`.
  const from = (((start % 1) + 1) % 1) * total;
  const wanted = clamped * total;

  const out: string[] = [];
  let travelled = 0;
  let emitted = 0;
  let began = false;

  const walk = (): void => {
    for (const contour of flattenPath(d, steps)) {
      for (let i = 1; i < contour.points.length; i++) {
        const a = contour.points[i - 1]!;
        const b = contour.points[i]!;
        const segment = Math.hypot(b.x - a.x, b.y - a.y);
        if (segment <= 0) continue;

        const segStart = travelled;
        const segEnd = travelled + segment;
        travelled = segEnd;

        // 🔴 A FIXED window. Computing the end as `from + (wanted - emitted)`
        // moves it forward as the walk emits, so each segment re-extends the
        // range and the slice overruns — half a hexagon measured 69 units long
        // instead of 120.
        const takeFrom = Math.max(from, segStart);
        const takeTo = Math.min(from + wanted, segEnd);
        if (takeTo <= takeFrom) continue;

        const p0 = lerp(a, b, (takeFrom - segStart) / segment);
        const p1 = lerp(a, b, (takeTo - segStart) / segment);
        if (!began) {
          out.push(`M ${p0.x} ${p0.y}`);
          began = true;
        }
        out.push(`L ${p1.x} ${p1.y}`);
        emitted += takeTo - takeFrom;
        if (emitted >= wanted - 1e-9) return;
      }
    }
  };

  walk();
  // Wrap: whatever is still owed continues from the start of the outline.
  if (emitted < wanted - 1e-9) {
    const rest = sliceOutline(d, 0, (wanted - emitted) / total, steps);
    if (rest.length > 0) out.push(rest.replace(/^M/, "L"));
  }
  return out.join(" ");
}

/**
 * Whether `point` lies inside the closed path `d`, by ray casting.
 *
 * The equivalent of `Path.contains`, used to assert that boundary points really
 * do sit on the shape.
 */
export function pathContains(d: string, point: Point, steps: number = DEFAULT_STEPS): boolean {
  let inside = false;
  for (const contour of flattenPath(d, steps)) {
    const pts = contour.points;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i]!;
      const b = pts[j]!;
      const straddles = a.y > point.y !== b.y > point.y;
      if (!straddles) continue;
      const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
      if (point.x < x) inside = !inside;
    }
  }
  return inside;
}
