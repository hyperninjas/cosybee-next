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
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${viewBoxWidth} ${viewBoxHeight}'>${paths}</svg>`;
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
 * Canonical 3-hex hive cluster: one hex on the left, two stacked on the
 * right, all three meeting near a single shared vertex — the tightest
 * symmetric arrangement of three flat-top hexagons.
 *
 *      ____
 *     / B  \
 *    /______\___
 *    \    A /    \
 *     \    /__C__/
 *      \___/
 *
 * Each hex's center sits 120° from the cluster centroid; `HIVE_GAP` moves
 * each hex outward along that axis by the same amount, so spacing stays
 * symmetric. Set `HIVE_GAP = 0` to bring the hexes back to vertex contact.
 *
 * Wrapper: `aspect-[350/346]` is close enough for any small gap; the SVG
 * mask absorbs the few-percent distortion.
 */
export const HIVE_GAP = 10;

const SQRT_3 = Math.sqrt(3);
const SQRT_3_OVER_2 = SQRT_3 / 2;

export const HIVE_3_VIEWBOX = {
  w: 350 + 1.5 * HIVE_GAP,
  h: 346.4 + SQRT_3 * HIVE_GAP,
};

export const HIVE_3_PLACEMENTS: HexPlacement[] = [
  // A — left  (outward direction: (-1, 0))
  { x: 0, y: 86.6 + SQRT_3_OVER_2 * HIVE_GAP, scale: 2 },
  // B — top-right  (outward direction: (+½, -√3⁄2))
  { x: 150 + 1.5 * HIVE_GAP, y: 0, scale: 2 },
  // C — bottom-right  (outward direction: (+½, +√3⁄2))
  { x: 150 + 1.5 * HIVE_GAP, y: 173.2 + SQRT_3 * HIVE_GAP, scale: 2 },
];
