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
 * Sizing: the wrapper has no width of its own — the parent container
 * (typically with an `aspect-[w/h]` class matching the viewBox) provides it.
 */
export default function SharedImageHexCluster({
  src,
  viewBox,
  placements,
  fallbackColor = "#2a2a2a",
}: {
  src: string;
  /** Match the wrapper's aspect ratio for distortion-free corners. */
  viewBox: { w: number; h: number };
  placements: HexPlacement[];
  /** Shown while the photo loads or if its URL fails. */
  fallbackColor?: string;
}) {
  const maskUrl = buildHexMaskDataUri(viewBox.w, viewBox.h, placements);
  return (
    <div
      aria-hidden
      className="h-full w-full"
      style={{
        backgroundImage: `url('${src}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: fallbackColor,
        ...hexMaskStyle(maskUrl),
      }}
    />
  );
}
