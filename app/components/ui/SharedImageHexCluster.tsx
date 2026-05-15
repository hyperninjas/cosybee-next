import {
  buildHexMaskDataUri,
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
 */
export default function SharedImageHexCluster({
  src,
  viewBox,
  placements,
  fallbackColor = "#2a2a2a",
  className = "",
}: {
  src: string;
  viewBox: { w: number; h: number };
  placements: HexPlacement[];
  /** Shown while the photo loads or if its URL fails. */
  fallbackColor?: string;
  /** Width / position utilities. Height is auto from the viewBox aspect. */
  className?: string;
}) {
  const maskUrl = buildHexMaskDataUri(viewBox.w, viewBox.h, placements);
  return (
    <div
      aria-hidden
      className={className}
      style={{
        aspectRatio: `${viewBox.w} / ${viewBox.h}`,
        backgroundImage: `url('${src}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: fallbackColor,
        ...hexMaskStyle(maskUrl),
      }}
    />
  );
}
