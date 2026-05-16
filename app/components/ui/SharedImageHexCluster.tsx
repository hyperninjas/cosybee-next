import {
  HIVE_3_PLACEMENTS,
  HIVE_3_VIEWBOX,
  buildHexMaskDataUri,
  computeHive3Layout,
  hexMaskStyle,
  type HexPlacement,
} from "@/app/lib/hex";

/**
 * One photo revealed through multiple hex "windows". The image is a single
 * background that covers the whole cluster; an SVG `mask-image` shows only
 * the parts that fall inside the hex shapes.
 *
 * The component sets its own `aspect-ratio` from the viewBox, so callers
 * only need to control width (via `className`) — height follows. This
 * keeps the mask shapes geometrically true even when scales or gaps change.
 *
 * Layout precedence (most → least specific):
 *   1. `gap` — recomputes the canonical 3-hex hive with a custom outward
 *      push (in viewBox units). Overrides any passed viewBox/placements.
 *   2. Explicit `viewBox` + `placements` props — for arbitrary clusters.
 *   3. Omit everything → falls back to the canonical HIVE_3 defaults.
 */
export default function SharedImageHexCluster({
  src,
  viewBox: viewBoxProp,
  placements: placementsProp,
  fallbackColor = "#2a2a2a",
  className = "",
  bgPosition = "center",
  bgSize = "cover",
  gap,
}: {
  src: string;
  /** Custom cluster viewBox. Defaults to `HIVE_3_VIEWBOX`. */
  viewBox?: { w: number; h: number };
  /** Custom hex placements. Defaults to `HIVE_3_PLACEMENTS`. */
  placements?: HexPlacement[];
  /** Shown while the photo loads or if its URL fails. */
  fallbackColor?: string;
  /** Width / position utilities. Height is auto from the viewBox aspect. */
  className?: string;
  bgPosition?: string;
  bgSize?: string;
  /**
   * Override the canonical outward-push gap between hexes (viewBox units).
   * When set, recomputes the HIVE_3 layout and ignores any passed
   * viewBox/placements. Pass `0` for exact vertex contact.
   */
  gap?: number;
}) {
  // Use the shared default constants when no overrides are given so we
  // don't pay for recomputation on every render in the common case.
  let viewBox: { w: number; h: number };
  let placements: HexPlacement[];
  if (gap !== undefined) {
    const layout = computeHive3Layout(gap);
    viewBox = layout.viewBox;
    placements = layout.placements;
  } else {
    viewBox = viewBoxProp ?? HIVE_3_VIEWBOX;
    placements = placementsProp ?? HIVE_3_PLACEMENTS;
  }

  const maskUrl = buildHexMaskDataUri(viewBox.w, viewBox.h, placements);
  return (
    <div
      aria-hidden
      className={className}
      style={{
        aspectRatio: `${viewBox.w} / ${viewBox.h}`,
        backgroundImage: `url('${src}')`,
        backgroundSize: bgSize,
        backgroundRepeat: "no-repeat",
        backgroundPosition: bgPosition,
        backgroundColor: fallbackColor,
        ...hexMaskStyle(maskUrl),
      }}
    />
  );
}
