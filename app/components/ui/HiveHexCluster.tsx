import { type ReactNode } from "react";
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
  /** Image URL rendered as the hex fill. */
  src?: string;
  /** Solid color (used as a fallback while `src` loads, or on its own). */
  color?: string;
  /** Overlay content rendered above the fill. Clipped to the hex outline
   *  (the mask cascades to all descendants of the cell). */
  children?: ReactNode;
};

/**
 * Three rounded hexagons in the canonical hive shape, each carrying its
 * own content. Sister to `SharedImageHexCluster` but lets you mix
 * different images (or images + colors + overlay children) across the
 * three slots.
 *
 * Geometry comes from `HIVE_3_PLACEMENTS` / `HIVE_3_VIEWBOX` — change the
 * gap or scale constants in `lib/hex.ts` and every cluster on the page
 * (shared-image *and* multi-image) reflows together.
 *
 * Each cell's wrapper is a positioning context, so `children` can use
 * `absolute` to overlay content. The hex mask is applied to the cell
 * wrapper, so overlay children are cropped to the hex outline too — a
 * phone or badge that would otherwise spill past the rounded corners
 * disappears cleanly at the edge.
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
   * Defaults to the shared `HIVE_GAP`. Pass `0` for exact vertex contact,
   * or any smaller-than-default value to tighten the cluster.
   */
  gap?: number;
}) {
  const cells = [left, topRight, bottomRight];

  // Use the shared default constants when no custom gap is given so we
  // don't pay for recomputation on every render in the common case.
  const { viewBox, placements } =
    gap !== undefined
      ? computeHive3Layout(gap)
      : { viewBox: HIVE_3_VIEWBOX, placements: HIVE_3_PLACEMENTS };

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
              backgroundImage: cell.src ? `url('${cell.src}')` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              // The mask applies to the whole painted output of this element
              // INCLUDING its children — so overlay content (phones, badges,
              // etc.) is cropped to the hex outline rather than the rect bbox.
              ...hexMaskStyle(SINGLE_HEX_MASK),
            }}
          >
            {cell.children}
          </div>
        );
      })}
    </div>
  );
}
