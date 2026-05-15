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
