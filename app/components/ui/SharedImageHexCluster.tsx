import Image, { type StaticImageData } from "next/image";
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
 * `<Image>` (next/image — AVIF/WebP, responsive, lazy by default) that
 * `fill`s the cluster bounds; an SVG `mask-image` on the wrapper shows
 * only the parts that fall inside the hex shapes.
 *
 * Layout precedence (most → least specific):
 *   1. `gap` — recomputes the canonical 3-hex hive with a custom outward
 *      push (in viewBox units). Overrides any passed viewBox/placements.
 *   2. Explicit `viewBox` + `placements` props — for arbitrary clusters.
 *   3. Omit everything → falls back to the canonical HIVE_3 defaults.
 */
export default function SharedImageHexCluster({
  src,
  alt = "",
  viewBox: viewBoxProp,
  placements: placementsProp,
  fallbackColor = "#2a2a2a",
  className = "",
  bgPosition = "center",
  bgSize = "cover",
  gap,
  priority = false,
  sizes = "(min-width: 1024px) 500px, (min-width: 640px) 440px, 320px",
  quality = 100,
  cornerInset,
}: {
  src: string | StaticImageData;
  alt?: string;
  /** Custom cluster viewBox. Defaults to `HIVE_3_VIEWBOX`. */
  viewBox?: { w: number; h: number };
  /** Custom hex placements. Defaults to `HIVE_3_PLACEMENTS`. */
  placements?: HexPlacement[];
  /** Shown while the photo loads or if its URL fails. */
  fallbackColor?: string;
  /** Width / position utilities. Height is auto from the viewBox aspect. */
  className?: string;
  /** Image positioning inside the cluster (CSS `object-position` syntax). */
  bgPosition?: string;
  /** Image scaling — "cover" or "contain". */
  bgSize?: "cover" | "contain";
  /**
   * Override the canonical outward-push gap between hexes (viewBox units).
   * When set, recomputes the HIVE_3 layout and ignores any passed
   * viewBox/placements. Pass `0` for exact vertex contact.
   */
  gap?: number;
  /** Mark as a priority load — use for above-the-fold clusters (LCP). */
  priority?: boolean;
  /** Responsive `sizes` hint. Tune per use site for best optimisation. */
  sizes?: string;
  /**
   * Image quality (0-100). Default 100 — the image is masked through a hex
   * shape at small-to-medium viewport widths, so 50% AVIF/WebP is visually
   * indistinguishable from 75 at half the bytes.
   */
  quality?: number;
  /**
   * Corner-radius dial for the rounded hex outline. Defaults to 8 (the
   * canonical look). Smaller = sharper corners (e.g. `4` is noticeably
   * pointier, `2` is almost angular); larger = rounder.
   */
  cornerInset?: number;
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

  const maskUrl = buildHexMaskDataUri(
    viewBox.w,
    viewBox.h,
    placements,
    cornerInset !== undefined ? { cornerInset } : undefined,
  );
  return (
    <div
      className={`relative ${className}`}
      style={{
        aspectRatio: `${viewBox.w} / ${viewBox.h}`,
        backgroundColor: fallbackColor,
        ...hexMaskStyle(maskUrl),
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        quality={quality}
        style={{
          objectFit: bgSize,
          objectPosition: bgPosition,
        }}
      />
    </div>
  );
}
