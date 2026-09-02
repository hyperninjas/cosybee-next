import type { Point, Rect } from "../model/types";
import { coord } from "../model/finite";
import { centerOf, longestSide } from "../model/types";

/** Which way a hexagon is turned. */
export type HexagonOrientation =
  /**
   * Flat edges left and right, vertices top and bottom. The default, because
   * the diagram's horizontal flow (grid to home) then meets a flat edge rather
   * than a corner.
   */
  | "pointyTop"
  /** Flat edges top and bottom, vertices left and right. */
  | "flatTop";

/**
 * The outline of a diagram node.
 *
 * Everything downstream — the border, the segmented consumption ring and the
 * points where flow lines attach — is derived from this, so swapping the shape
 * is the only change needed to move between circular and hexagonal nodes.
 */
export interface EnergyNodeShape {
  /** A stable identity, so React can memoise on it. */
  readonly id: string;
  /** The closed outline inside `rect`, as an SVG path. */
  buildPath(rect: Rect): string;
  /**
   * The point on the outline lying in direction `angle` from the centre of
   * `rect`, in radians, with zero pointing right and positive angles turning
   * towards the bottom of the screen.
   */
  boundaryPoint(rect: Rect, angle: number): Point;
}

const deflate = (r: Rect, by: number): Rect => ({
  x: r.x + by,
  y: r.y + by,
  width: Math.max(0, r.width - by * 2),
  height: Math.max(0, r.height - by * 2),
});

/** Shrinks a rect on all sides, as Flutter's `Rect.deflate` does. */
export const deflateRect = deflate;

/** A circular node outline, matching the reference card. */
export const circleNodeShape = (): EnergyNodeShape => ({
  id: "circle",
  buildPath(rect) {
    const c = centerOf(rect);
    const rx = rect.width / 2;
    const ry = rect.height / 2;
    // Four cubics rather than two arcs. The magic constant is the standard
    // circle-to-Bezier ratio, accurate to about 0.02 % of the radius — well
    // inside a stroke width — and it means `pathGeometry` needs to flatten only
    // M/L/Q/C/Z and never arcs.
    const k = 0.5522847498307936;
    const ox = rx * k;
    const oy = ry * k;
    const [l, r, t, b] = [c.x - rx, c.x + rx, c.y - ry, c.y + ry];
    const n = coord;
    return [
      `M ${n(l)} ${n(c.y)}`,
      `C ${n(l)} ${n(c.y - oy)}, ${n(c.x - ox)} ${n(t)}, ${n(c.x)} ${n(t)}`,
      `C ${n(c.x + ox)} ${n(t)}, ${n(r)} ${n(c.y - oy)}, ${n(r)} ${n(c.y)}`,
      `C ${n(r)} ${n(c.y + oy)}, ${n(c.x + ox)} ${n(b)}, ${n(c.x)} ${n(b)}`,
      `C ${n(c.x - ox)} ${n(b)}, ${n(l)} ${n(c.y + oy)}, ${n(l)} ${n(c.y)}`,
      "Z",
    ].join(" ");
  },
  boundaryPoint(rect, angle) {
    const c = centerOf(rect);
    return {
      x: c.x + (rect.width / 2) * Math.cos(angle),
      y: c.y + (rect.height / 2) * Math.sin(angle),
    };
  },
});

/**
 * A regular polygon node outline with optionally rounded corners.
 *
 * `rotation` turns the polygon, in radians. At zero, the first vertex sits
 * directly to the right of the centre.
 */
export function polygonNodeShape(options: {
  sides: number;
  rotation?: number;
  cornerRadius?: number;
  id?: string;
}): EnergyNodeShape {
  const { sides, rotation = 0, cornerRadius = 0 } = options;
  if (sides < 3) throw new Error("A polygon needs at least three sides");

  const vertices = (rect: Rect): Point[] => {
    const c = centerOf(rect);
    const rx = rect.width / 2;
    const ry = rect.height / 2;
    const out: Point[] = [];
    for (let i = 0; i < sides; i++) {
      const a = rotation + (i * 2 * Math.PI) / sides;
      out.push({ x: c.x + rx * Math.cos(a), y: c.y + ry * Math.sin(a) });
    }
    return out;
  };

  return {
    id: options.id ?? `polygon:${sides}:${rotation}:${cornerRadius}`,

    buildPath(rect) {
      const points = vertices(rect);

      if (cornerRadius <= 0) {
        return (
          points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${coord(p.x)} ${coord(p.y)}`)
            .join(" ") + " Z"
        );
      }

      // Trim each corner back along both adjacent edges, then round the gap off
      // with a quadratic through the original vertex.
      const parts: string[] = [];
      for (let i = 0; i < points.length; i++) {
        const previous = points[(i - 1 + points.length) % points.length]!;
        const current = points[i]!;
        const next = points[(i + 1) % points.length]!;

        const inLength = Math.hypot(current.x - previous.x, current.y - previous.y);
        const outLength = Math.hypot(next.x - current.x, next.y - current.y);
        const radius = Math.min(cornerRadius, Math.min(inLength, outLength) / 2);

        const inDir =
          inLength === 0
            ? { x: 0, y: 0 }
            : { x: (current.x - previous.x) / inLength, y: (current.y - previous.y) / inLength };
        const outDir =
          outLength === 0
            ? { x: 0, y: 0 }
            : { x: (next.x - current.x) / outLength, y: (next.y - current.y) / outLength };

        const start = { x: current.x - inDir.x * radius, y: current.y - inDir.y * radius };
        const end = { x: current.x + outDir.x * radius, y: current.y + outDir.y * radius };

        parts.push(`${i === 0 ? "M" : "L"} ${coord(start.x)} ${coord(start.y)}`);
        parts.push(
          `Q ${coord(current.x)} ${coord(current.y)} ${coord(end.x)} ${coord(end.y)}`,
        );
      }
      return parts.join(" ") + " Z";
    },

    boundaryPoint(rect, angle) {
      const c = centerOf(rect);
      // Cast far enough to clear the shape whatever its aspect ratio.
      const reach = longestSide(rect) * 2;
      const far = { x: c.x + Math.cos(angle) * reach, y: c.y + Math.sin(angle) * reach };

      const points = vertices(rect);
      for (let i = 0; i < points.length; i++) {
        const a = points[i]!;
        const b = points[(i + 1) % points.length]!;
        const hit = segmentIntersection(c, far, a, b);
        if (hit) return hit;
      }
      // Numerically impossible for a convex polygon containing the centre, but
      // fall back to the circumscribed circle rather than throwing.
      return {
        x: c.x + (rect.width / 2) * Math.cos(angle),
        y: c.y + (rect.height / 2) * Math.sin(angle),
      };
    },
  };
}

/** A regular hexagon with softened corners. */
export function hexagonNodeShape(
  options: { orientation?: HexagonOrientation; cornerRadius?: number } = {},
): EnergyNodeShape {
  const { orientation = "pointyTop", cornerRadius = 6 } = options;
  return polygonNodeShape({
    sides: 6,
    rotation: orientation === "pointyTop" ? -Math.PI / 2 : 0,
    cornerRadius,
    id: `hexagon:${orientation}:${cornerRadius}`,
  });
}

/** Intersection of segments `p1->p2` and `p3->p4`, or null if they miss. */
export function segmentIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): Point | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-12) return null;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
}

export const NODE_SHAPES = {
  circle: circleNodeShape(),
  hexagon: hexagonNodeShape(),
} as const;
