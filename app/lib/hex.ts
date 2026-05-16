/**
 * Rounded flat-top hexagon: points on left/right, flat top/bottom, every
 * corner softly rounded via a quadratic curve. Drawn in its own 100×86.6
 * coordinate space so callers can `translate` + `scale` it as needed.
 */
export const HEX_PATH =
  "M33,0 L67,0 Q75,0 79,6.93 L96,36.37 Q100,43.3 96,50.23 L79,79.67 Q75,86.6 67,86.6 L33,86.6 Q25,86.6 21,79.67 L4,50.23 Q0,43.3 4,36.37 L21,6.93 Q25,0 33,0 Z";

/** Placement of a single hex within a `SharedImageHexCluster` viewBox. */
export type HexPlacement = {
  /** X translation in viewBox units. */
  x: number;
  /** Y translation in viewBox units. */
  y: number;
  /** Uniform scale applied to the 100×86.6 hex path. */
  scale: number;
};

/**
 * Build a CSS `mask-image` data URI containing one or more rounded hex
 * shapes inside a single SVG. Use as `mask-image`/`-webkit-mask-image` on a
 * div whose background is the image you want revealed through the hexes.
 */
export function buildHexMaskDataUri(
  viewBoxWidth: number,
  viewBoxHeight: number,
  placements: HexPlacement[],
): string {
  const paths = placements
    .map(
      (p) =>
        `<path d='${HEX_PATH}' transform='translate(${p.x} ${p.y}) scale(${p.scale})' fill='black'/>`,
    )
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${viewBoxWidth} ${viewBoxHeight}' preserveAspectRatio='none'>${paths}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/**
 * The standard cross-browser style block for applying a hex mask. Spread
 * onto a div's `style` prop alongside a `backgroundImage`.
 */
export function hexMaskStyle(maskUrl: string): React.CSSProperties {
  return {
    WebkitMaskImage: maskUrl,
    maskImage: maskUrl,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  };
}

/**
 * Canonical 3-hex hive cluster with size variation:
 *   - A (left)  and B (top-right) share a small scale.
 *   - C (bottom-right) is larger.
 *
 * All three meet at a single vertex `V` (mathematically exact contact;
 * `HIVE_GAP` then slides each hex outward 120° from the cluster centroid
 * to introduce uniform breathing room).
 *
 *      ____
 *     / B  \
 *    /______\______
 *    \    A /      \
 *     \    /        \
 *      \__/    C     \
 *          \         /
 *           \_______/
 *
 * The hex path is drawn in a 100×86.6 local space, so a hex of scale `s`
 * is 100s wide and 86.6s tall. Mathematical sharp vertices (NOT the rounded
 * curve-start points 33/67 — those are inset by 8 from the corners):
 *     left=(0,43.3), right=(100,43.3),
 *     top-left=(25,0), top-right=(75,0),
 *     bottom-left=(25,86.6), bottom-right=(75,86.6).
 *
 * Anchoring V = (100s, 86.6s) — A's right vertex, B's bottom-left vertex,
 * and C's top-left vertex all meet at V — gives:
 *     A.translate = (0,             43.3·s)     scale s
 *     B.translate = (75·s,          0)          scale s
 *     C.translate = (100·s − 25·s′, 86.6·s)     scale s′
 *
 * Outward-by-gap offsets are then added in normalized 120° directions:
 *     A: (−1,   0)              ·gap   →  shift cluster +gap right
 *     B: (+½,  −√3⁄2)           ·gap   →  shift cluster +√3⁄2·gap down
 *     C: (+½,  +√3⁄2)           ·gap
 */
export const HIVE_GAP = 5;
export const HIVE_SCALE_SMALL = 2; // A and B
export const HIVE_SCALE_LARGE = 2.5; // C — the prominent bottom-right hex

const SQRT_3 = Math.sqrt(3);
const SQRT_3_OVER_2 = SQRT_3 / 2;

/**
 * Compute the hive viewBox and per-hex placements for a given outward-push
 * `gap` (in viewBox units). The canonical layout uses `HIVE_GAP`; pass a
 * smaller value to tighten the cluster, 0 for exact vertex contact.
 */
export function computeHive3Layout(gap: number = HIVE_GAP) {
  const s = HIVE_SCALE_SMALL;
  const sBig = HIVE_SCALE_LARGE;
  const g = gap;
  const viewBox = {
    w: 100 * s + 75 * sBig + 1.5 * g,
    h: 86.6 * (s + sBig) + SQRT_3 * g,
  };
  const placements: HexPlacement[] = [
    // A — small, left
    { x: 0, y: 43.3 * s + SQRT_3_OVER_2 * g, scale: s },
    // B — small, top-right
    { x: 75 * s + 1.5 * g, y: 0, scale: s },
    // C — LARGE, bottom-right
    {
      x: 100 * s - 25 * sBig + 1.5 * g,
      y: 86.6 * s + SQRT_3 * g,
      scale: sBig,
    },
  ];
  return { viewBox, placements };
}

const defaultHive3 = computeHive3Layout(HIVE_GAP);
export const HIVE_3_VIEWBOX = defaultHive3.viewBox;
export const HIVE_3_PLACEMENTS = defaultHive3.placements;

/**
 * Aspect ratio of the canonical hive viewBox. Use as inline
 * `style={{ aspectRatio: HIVE_3_ASPECT }}` on wrappers so they stay in
 * sync when the gap or scales change.
 */
export const HIVE_3_ASPECT = HIVE_3_VIEWBOX.w / HIVE_3_VIEWBOX.h;
