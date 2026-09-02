import type { EnergyNodeId, Rect } from "../model/types";
import { NODE_IDS, bottomOf, centerOf, nodeId, nodeKey, rect, translate } from "../model/types";
import { clampFinite, nonNegative, positive } from "../model/finite";
import { effectiveHomeNodeSize, type EnergyFlowStyle } from "./style";

/**
 * Computes where each node sits for a given width.
 *
 * The arrangement mirrors the reference card: low-carbon, solar and the
 * individual loads across the top; grid and home in the middle; battery
 * underneath. Rows with no visible node collapse, so a grid-only system stays
 * compact.
 *
 * The layout is fully adaptive:
 *
 * * It never exceeds `style.maxWidth`, centring itself in whatever space it is
 *   given, so the diagram does not stretch absurdly on tablets.
 * * When the available width cannot fit the widest row at full size, every
 *   node, gap and stroke is scaled down by `scale` rather than overflowing.
 * * When the preferred arrangement would overlap — typically several individual
 *   loads competing with the centred solar node — the top row falls back to
 *   even distribution.
 * * `labelHeight` is supplied by the caller from the real text metrics, so the
 *   layout respects the user's font scale setting.
 */
export interface EnergyFlowLayout {
  /** Where each visible node sits, excluding its label. Keyed by `nodeKey`. */
  readonly nodeRects: ReadonlyMap<string, Rect>;
  /**
   * Where each node's label sits.
   *
   * Top-row labels are placed *above* their node: every flow leaving the top
   * row exits downwards, so a label underneath would be crossed by its own
   * connection line. Middle and bottom rows keep their labels underneath.
   */
  readonly labelRects: ReadonlyMap<string, Rect>;
  /** Total size occupied by the diagram. */
  readonly size: { readonly width: number; readonly height: number };
  /** Vertical space reserved under each node for its label. */
  readonly labelHeight: number;
  /**
   * Uniform factor applied to node sizes, gaps and strokes when the available
   * width could not fit the widest row. 1.0 means nothing was shrunk.
   */
  readonly scale: number;
  /**
   * Horizontal offset applied to centre the diagram within the available width,
   * non-zero only when clamped by `style.maxWidth`.
   */
  readonly originX: number;
}

export interface ComputeLayoutArgs {
  readonly availableWidth: number;
  readonly style: EnergyFlowStyle;
  readonly hasGrid: boolean;
  readonly hasSolar: boolean;
  readonly hasBattery: boolean;
  readonly hasLowCarbon: boolean;
  readonly individualIndexes: readonly number[];
  readonly hasExport?: boolean;
  readonly labelHeight?: number;
}

export function computeLayout(args: ComputeLayoutArgs): EnergyFlowLayout {
  const {
    availableWidth: rawWidth,
    style,
    hasGrid,
    hasSolar,
    hasBattery,
    hasLowCarbon,
    individualIndexes,
    hasExport = false,
    labelHeight: rawLabelHeight = 18,
  } = args;

  // ── Boundary guards ───────────────────────────────────────────────────────
  //
  // 🔴 Every dimension below is multiplied into node rects and then into path
  // coordinates. One unusable number therefore does not produce a wonky layout,
  // it produces `d="M NaN NaN ..."` on every edge — which the browser renders
  // as nothing at all, silently. A container that has not been measured yet
  // reports 0, and a caller computing a width from a string can hand us NaN.
  const availableWidth = nonNegative(rawWidth, 0);
  const labelHeight = nonNegative(rawLabelHeight, 18);

  // ── Row membership ────────────────────────────────────────────────────────
  const topCount = (hasLowCarbon ? 1 : 0) + (hasSolar ? 1 : 0) + individualIndexes.length;
  const hasTopRow = topCount > 0;
  // Export shares the bottom row with the battery, in the grid's column: the
  // whole left side of the diagram is then "the grid", import above and export
  // below, and both of export's sources (solar overhead, battery alongside)
  // reach it without crossing another node.
  const bottomCount = (hasExport ? 1 : 0) + (hasBattery ? 1 : 0);
  const hasBottomRow = bottomCount > 0;

  const baseNodeW = positive(style.nodeSize.width, 80);
  const baseNodeH = positive(style.nodeSize.height, 80);
  const home = effectiveHomeNodeSize(style);
  const baseHomeW = positive(home.width, baseNodeW);
  const baseHomeH = positive(home.height, baseNodeH);
  const baseGap = nonNegative(style.nodeSpacing, 24);

  // ── How much width does the widest row actually need? ─────────────────────
  const rowWidth = (count: number, nodeWidth: number): number =>
    count <= 0 ? 0 : count * nodeWidth + (count - 1) * baseGap;

  const topNeeded = rowWidth(topCount, baseNodeW);
  const middleNeeded = (hasGrid ? baseNodeW + baseGap : 0) + baseHomeW;
  const bottomNeeded = rowWidth(bottomCount, baseNodeW);
  const needed = Math.max(topNeeded, Math.max(middleNeeded, bottomNeeded));

  // ── Clamp to maxWidth, then scale down if still too tight ─────────────────
  const maxWidth =
    style.maxWidth === null || style.maxWidth === undefined
      ? null
      : positive(style.maxWidth, 470);
  const boxWidth = maxWidth === null ? availableWidth : Math.min(availableWidth, maxWidth);
  const originX = Math.max(0, (availableWidth - boxWidth) / 2);

  // `minScale` is clamped into (0, 1]: zero or negative would collapse every
  // node to nothing, and above 1 would magnify rather than shrink.
  const minScale = clampFinite(style.minScale, 0.05, 1, 0.55);
  const scale =
    needed <= 0 || boxWidth >= needed ? 1 : Math.max(minScale, boxWidth / needed);

  const nodeW = baseNodeW * scale;
  const nodeH = baseNodeH * scale;
  const homeW = baseHomeW * scale;
  const homeH = baseHomeH * scale;
  const gap = baseGap * scale;
  const rowGap = nonNegative(style.rowSpacing, 42) * scale;

  // ── Column anchors ────────────────────────────────────────────────────────
  const left = 0;
  const right = Math.max(0, boxWidth - homeW);
  const centre = Math.max(0, (boxWidth - nodeW) / 2);

  const middleRowHeight = Math.max(nodeH, homeH);

  let y = 0;
  const rects = new Map<string, Rect>();
  const labels = new Map<string, Rect>();

  // Labels are twice the node width so longer names have room to centre.
  const labelBelow = (node: Rect): Rect =>
    rect(centerOf(node).x - node.width, bottomOf(node) + 2, node.width * 2, labelHeight);
  const labelAbove = (node: Rect): Rect =>
    rect(centerOf(node).x - node.width, node.y - labelHeight, node.width * 2, labelHeight);

  // ── Top row ───────────────────────────────────────────────────────────────
  if (hasTopRow) {
    const rowY = y + labelHeight;

    // Preferred arrangement: low-carbon hugs the left, solar is centred, and
    // the individual loads stack rightwards so the first sits above the home
    // node. Only usable when nothing would overlap.
    const individualsLeftEdge =
      individualIndexes.length === 0
        ? boxWidth
        : boxWidth - nodeW - (individualIndexes.length - 1) * (nodeW + gap);
    const lowCarbonFits = !hasLowCarbon || !hasSolar || left + nodeW + gap <= centre;
    const individualsFit =
      individualIndexes.length === 0 || !hasSolar || centre + nodeW + gap <= individualsLeftEdge;
    const preferred = lowCarbonFits && individualsFit && individualsLeftEdge >= 0;

    if (preferred) {
      if (hasLowCarbon) rects.set(nodeKey(NODE_IDS.lowCarbon), rect(left, rowY, nodeW, nodeH));
      if (hasSolar) rects.set(nodeKey(NODE_IDS.solar), rect(centre, rowY, nodeW, nodeH));
      for (let j = 0; j < individualIndexes.length; j++) {
        const x = boxWidth - nodeW - j * (nodeW + gap);
        rects.set(
          nodeKey(nodeId("individual", individualIndexes[j]!)),
          rect(x, rowY, nodeW, nodeH),
        );
      }
    } else {
      // Fallback: spread the whole row evenly, left to right.
      const total = topCount * nodeW + (topCount - 1) * gap;
      let x = Math.max(0, (boxWidth - total) / 2);
      if (hasLowCarbon) {
        rects.set(nodeKey(NODE_IDS.lowCarbon), rect(x, rowY, nodeW, nodeH));
        x += nodeW + gap;
      }
      if (hasSolar) {
        rects.set(nodeKey(NODE_IDS.solar), rect(x, rowY, nodeW, nodeH));
        x += nodeW + gap;
      }
      for (const index of individualIndexes) {
        rects.set(nodeKey(nodeId("individual", index)), rect(x, rowY, nodeW, nodeH));
        x += nodeW + gap;
      }
    }

    const topIds: EnergyNodeId[] = [
      NODE_IDS.lowCarbon,
      NODE_IDS.solar,
      ...individualIndexes.map((index) => nodeId("individual", index)),
    ];
    for (const id of topIds) {
      const r = rects.get(nodeKey(id));
      if (r) labels.set(nodeKey(id), labelAbove(r));
    }
    y += labelHeight + nodeH + rowGap;
  }

  // ── Middle row ────────────────────────────────────────────────────────────
  const middleY = y;
  if (hasGrid) {
    rects.set(
      nodeKey(NODE_IDS.grid),
      rect(left, middleY + (middleRowHeight - nodeH) / 2, nodeW, nodeH),
    );
  }
  rects.set(
    nodeKey(NODE_IDS.home),
    rect(right, middleY + (middleRowHeight - homeH) / 2, homeW, homeH),
  );
  for (const id of [NODE_IDS.grid, NODE_IDS.home]) {
    const r = rects.get(nodeKey(id));
    if (r) labels.set(nodeKey(id), labelBelow(r));
  }
  y += middleRowHeight + labelHeight;

  // ── Bottom row ────────────────────────────────────────────────────────────
  if (hasBottomRow) {
    y += rowGap;
    // Export takes the left column so it sits directly under the grid node; the
    // battery keeps the centre it has always had, so adding an export node
    // never moves the battery.
    const batteryClearsExport = !hasExport || !hasBattery || centre >= left + nodeW + gap;
    if (batteryClearsExport) {
      if (hasExport) rects.set(nodeKey(NODE_IDS.export), rect(left, y, nodeW, nodeH));
      if (hasBattery) rects.set(nodeKey(NODE_IDS.battery), rect(centre, y, nodeW, nodeH));
    } else {
      // Same fallback the top row uses: when the preferred columns would
      // overlap, spread the row evenly rather than letting nodes collide.
      const total = bottomCount * nodeW + (bottomCount - 1) * gap;
      let x = Math.max(0, (boxWidth - total) / 2);
      rects.set(nodeKey(NODE_IDS.export), rect(x, y, nodeW, nodeH));
      x += nodeW + gap;
      rects.set(nodeKey(NODE_IDS.battery), rect(x, y, nodeW, nodeH));
    }
    for (const id of [NODE_IDS.export, NODE_IDS.battery]) {
      const r = rects.get(nodeKey(id));
      if (r) labels.set(nodeKey(id), labelBelow(r));
    }
    y += nodeH + labelHeight;
  }

  // Shift everything if the diagram is narrower than the space available.
  const shift = (source: Map<string, Rect>): Map<string, Rect> => {
    if (originX === 0) return source;
    const out = new Map<string, Rect>();
    for (const [key, value] of source) out.set(key, translate(value, originX, 0));
    return out;
  };

  return {
    nodeRects: shift(rects),
    labelRects: shift(labels),
    size: { width: availableWidth, height: y },
    labelHeight,
    scale,
    originX,
  };
}

/** The rect for `id`, or undefined when that node is not visible. */
export const rectOf = (l: EnergyFlowLayout, id: EnergyNodeId): Rect | undefined =>
  l.nodeRects.get(nodeKey(id));

/** The label rect for `id`, or undefined when that node is not visible. */
export const labelRectOf = (l: EnergyFlowLayout, id: EnergyNodeId): Rect | undefined =>
  l.labelRects.get(nodeKey(id));

/** Whether `id` is present in this layout. */
export const layoutHas = (l: EnergyFlowLayout, id: EnergyNodeId): boolean =>
  l.nodeRects.has(nodeKey(id));
