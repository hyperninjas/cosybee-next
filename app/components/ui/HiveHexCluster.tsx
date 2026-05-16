import { type ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import {
  HIVE_3_PLACEMENTS,
  HIVE_3_VIEWBOX,
  buildHexMaskDataUri,
  computeHive3Layout,
  hexMaskStyle,
} from "@/app/lib/hex";

/** Mask containing exactly one rounded hex at the origin of a 100×86.6 box. */
const SINGLE_HEX_MASK = buildHexMaskDataUri(100, 86.6, [
  { x: 0, y: 0, scale: 1 },
]);

export type HexCell = {
  /** Image (StaticImageData from import OR URL string) shown inside the cell. */
  src?: string | StaticImageData;
  /** Alt text for the image. Empty by default — decorative. */
  alt?: string;
  /** Solid color (used as a fallback while `src` loads, or on its own). */
  color?: string;
  /** Overlay content rendered above the fill. Clipped to the hex outline
   *  (the mask cascades to all descendants of the cell). */
  children?: ReactNode;
  /** Mark this cell's image as priority — use for above-the-fold cells. */
  priority?: boolean;
  /** Responsive `sizes` hint for this cell's image. */
  sizes?: string;
  /** Image quality (0-100). Defaults to 50 — masked-through-hex at small
   *  display sizes hides any visual loss vs. the 75 default. */
  quality?: number;
};

/**
 * Three rounded hexagons in the canonical hive shape, each carrying its
 * own content via `next/image`. Sister to `SharedImageHexCluster` but
 * lets you mix different images across the three slots.
 *
 * Geometry comes from `HIVE_3_PLACEMENTS` / `HIVE_3_VIEWBOX` — change the
 * gap or scale constants in `lib/hex.ts` and every cluster on the page
 * reflows together.
 *
 * Each cell's wrapper is a positioning context, so `children` can use
 * `absolute` to overlay content. The hex mask is applied to the cell
 * wrapper, so overlay children are cropped to the hex outline too.
 */
export default function HiveHexCluster({
  left,
  topRight,
  bottomRight,
  className = "",
  gap,
}: {
  left: HexCell;
  topRight: HexCell;
  bottomRight: HexCell;
  /** Width / position utilities. Height follows the hive aspect ratio. */
  className?: string;
  /**
   * Override the canonical outward-push gap between hexes (viewBox units).
   * Defaults to the shared `HIVE_GAP`. Pass `0` for exact vertex contact.
   */
  gap?: number;
}) {
  const cells = [left, topRight, bottomRight];

  const { viewBox, placements } =
    gap !== undefined
      ? computeHive3Layout(gap)
      : { viewBox: HIVE_3_VIEWBOX, placements: HIVE_3_PLACEMENTS };

  // Default sizes — small enough that responsive images stay tight.
  const DEFAULT_CELL_SIZES =
    "(min-width: 1024px) 250px, (min-width: 640px) 200px, 150px";

  return (
    <div
      className={`relative ${className}`}
      style={{ aspectRatio: `${viewBox.w} / ${viewBox.h}` }}
    >
      {cells.map((cell, i) => {
        const p = placements[i];
        const leftPct = (p.x / viewBox.w) * 100;
        const topPct = (p.y / viewBox.h) * 100;
        const widthPct = ((100 * p.scale) / viewBox.w) * 100;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              aspectRatio: "100 / 86.6",
              backgroundColor: cell.color,
              // The mask applies to the whole painted output of this element
              // INCLUDING its children — so the next/image element AND any
              // overlay content are both cropped to the hex outline.
              ...hexMaskStyle(SINGLE_HEX_MASK),
            }}
          >
            {cell.src && (
              <Image
                src={cell.src}
                alt={cell.alt ?? ""}
                fill
                priority={cell.priority}
                sizes={cell.sizes ?? DEFAULT_CELL_SIZES}
                quality={cell.quality ?? 50}
                className="object-cover object-center"
              />
            )}
            {cell.children}
          </div>
        );
      })}
    </div>
  );
}
