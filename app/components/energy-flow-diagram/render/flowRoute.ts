import { coord, pathIsFinite } from "../model/finite";
import { flowValue, type EnergyFlowSolution } from "../model/solution";
import { durationFor } from "../model/flowRate";
import type { EnergyFlowKind, EnergyNodeId, IndividualLoad, Point, Rect } from "../model/types";
import { NODE_IDS, distance, nodeId } from "../model/types";
import { layoutHas, rectOf, type EnergyFlowLayout } from "./computeLayout";
import { pathLength } from "./pathGeometry";
import { individualColor, withAlpha, type EnergyFlowStyle } from "./style";

/**
 * Converts degrees to radians. Zero points right; angles increase towards the
 * bottom of the screen — the same convention in Flutter's canvas and in SVG,
 * which is why every anchor constant below ports across unchanged.
 */
const rad = (degrees: number): number => (degrees * Math.PI) / 180;

/** A dot travelling along a `FlowEdge`. */
export interface FlowDot {
  readonly kind: EnergyFlowKind;
  /** Index of the individual load, when `kind` is `"individual"`. */
  readonly individualIndex: number;
  readonly color: string;
  /** How long one traversal takes, in milliseconds. */
  readonly durationMs: number;
  /** Whether the dot travels from the end of the path towards the start. */
  readonly reversed: boolean;
  /** A stable key identifying this dot across rebuilds, so its phase survives. */
  readonly phaseKey: string;
}

/** One visual edge: a path between two nodes, plus whatever dots travel it. */
export interface FlowEdge {
  /** A stable identity for React keys. */
  readonly id: string;
  /** The line, running from source to target, as an SVG path. */
  readonly path: string;
  /**
   * Arc length of `path`, measured once at build time.
   *
   * Not needed to RENDER — the browser measures the path itself for
   * `animateMotion` — but carried because the Dart `FlowEdge` carries it, and
   * because a zero-length edge is a routing bug worth being able to assert on.
   */
  readonly length: number;
  readonly color: string;
  readonly dots: readonly FlowDot[];
  /** Whether any energy is flowing. */
  readonly isActive: boolean;
}

/**
 * Where a flow attaches to a node, as an angle around the node outline.
 *
 * Fanning the connections out around the home node keeps three inbound lines
 * from stacking on the same point, which is what the reference card does by
 * hand with hardcoded SVG coordinates.
 */
const ANCHORS = {
  solarExitToHome: 45,
  solarExitToGrid: 135,
  solarExitToBattery: 90,

  homeEntryFromSolar: 215,
  homeEntryFromGrid: 180,
  homeEntryFromBattery: 145,
  homeEntryFromIndividual: 270,

  gridEntryFromSolar: 315,
  gridEntryFromBattery: 45,
  gridExitToHome: 0,

  batteryEntryFromSolar: 270,
  batteryExitToHome: 315,
  batteryExitToGrid: 225,

  // Export sits under the grid, in the bottom row's left column. Solar comes
  // down its top-right shoulder and the battery comes straight across, so
  // neither line has to pass through the grid node between them.
  solarExitToExport: 135,
  exportEntryFromSolar: 315,
  batteryExitToExport: 180,
  exportEntryFromBattery: 0,

  individualExit: 90,
} as const;

export interface FlowRouteArgs {
  readonly layout: EnergyFlowLayout;
  readonly style: EnergyFlowStyle;
  readonly solution: EnergyFlowSolution;
  /** The configured individual loads, in input order. */
  readonly loads: readonly IndividualLoad[];
  /** Indexes into `loads` that are currently visible, in display order. */
  readonly visibleLoadIndexes: readonly number[];
}

function lineColor(style: EnergyFlowStyle, base: string, active: boolean): string {
  if (active) return base;
  switch (style.inactiveLineMode) {
    case "show":
      return base;
    case "hide":
    case "fade":
      return withAlpha(base, style.inactiveOpacity);
    case "grey":
      return style.inactiveColor;
  }
}

/**
 * Builds a smooth connector leaving `fromRect` at `fromAngle` and arriving at
 * `toRect` from `toAngle`.
 *
 * Both control points are pushed out along their node's outward normal, so the
 * line leaves and enters perpendicular to the outline. When the two anchors
 * face each other the cubic collapses to a straight line, which is what the
 * horizontal grid-to-home and vertical solar-to-battery links want.
 */
function connect(
  style: EnergyFlowStyle,
  fromRect: Rect,
  fromAngle: number,
  toRect: Rect,
  toAngle: number,
): string {
  const shape = style.shape;
  const start: Point = shape.boundaryPoint(fromRect, rad(fromAngle));
  const end: Point = shape.boundaryPoint(toRect, rad(toAngle));

  const startDir: Point = { x: Math.cos(rad(fromAngle)), y: Math.sin(rad(fromAngle)) };
  const endDir: Point = { x: Math.cos(rad(toAngle)), y: Math.sin(rad(toAngle)) };

  const handle = distance(start, end) * 0.45;

  const c1: Point = { x: start.x + startDir.x * handle, y: start.y + startDir.y * handle };
  const c2: Point = { x: end.x + endDir.x * handle, y: end.y + endDir.y * handle };

  const parts = [start, c1, c2, end];
  // A path whose `d` holds NaN renders as NOTHING, with no error anywhere — so a
  // single unusable coordinate would silently delete the line. Returning an
  // empty string lets the caller drop the edge instead, which is visible.
  if (!parts.every((pt) => Number.isFinite(pt.x) && Number.isFinite(pt.y))) return "";

  const [s0, s1, s2, s3] = parts.map((pt) => ({ x: coord(pt.x), y: coord(pt.y) }));
  return `M ${s0!.x} ${s0!.y} C ${s1!.x} ${s1!.y}, ${s2!.x} ${s2!.y}, ${s3!.x} ${s3!.y}`;
}

const phaseKeyFor = (kind: EnergyFlowKind, individualIndex: number): string =>
  kind === "individual" ? `individual:${individualIndex}` : kind;

/** Builds every edge that should be drawn. */
/** The largest single flow in a solution — the reference the proportional model scales against. */
export function peakFlow(solution: EnergyFlowSolution): number {
  return Math.max(
    solution.solarToHome,
    solution.solarToBattery,
    solution.solarToGrid,
    solution.batteryToHome,
    solution.batteryToGrid,
    solution.gridToHome,
    solution.gridToBattery,
    ...solution.individuals,
    0,
  );
}

export function buildEdges(args: FlowRouteArgs): FlowEdge[] {
  const { layout, style, solution, loads, visibleLoadIndexes } = args;
  const edges: FlowEdge[] = [];
  const peak = peakFlow(solution);

  // When the diagram carries a dedicated export node, everything leaving the
  // property terminates there instead of doubling back into the grid node. The
  // grid node is then purely the import source, which is what makes the two
  // directions readable as two different things.
  const hasExportNode = layoutHas(layout, NODE_IDS.export);

  const add = (spec: {
    from: EnergyNodeId;
    fromAngle: number;
    to: EnergyNodeId;
    toAngle: number;
    kind: EnergyFlowKind;
    color: string;
    individualIndex?: number;
    reversed?: boolean;
  }): void => {
    const { from, fromAngle, to, toAngle, kind, color } = spec;
    const individualIndex = spec.individualIndex ?? 0;
    const reversed = spec.reversed ?? false;

    const fromRect = rectOf(layout, from);
    const toRect = rectOf(layout, to);
    if (!fromRect || !toRect) return;

    const value = flowValue(solution, kind, individualIndex);
    const active = value > 0;
    if (!active && style.inactiveLineMode === "hide") return;

    const edgePath = connect(style, fromRect, fromAngle, toRect, toAngle);
    if (!pathIsFinite(edgePath)) return;
    edges.push({
      id: phaseKeyFor(kind, individualIndex),
      path: edgePath,
      length: pathLength(edgePath),
      color: lineColor(style, color, active),
      isActive: active,
      dots:
        active && style.showDots
          ? [
              {
                kind,
                individualIndex,
                color,
                durationMs: durationFor(style.flowRate, value, solution.totalLines, peak),
                reversed,
                phaseKey: phaseKeyFor(kind, individualIndex),
              },
            ]
          : [],
    });
  };

  // Solar fans out downwards.
  add({
    from: NODE_IDS.solar,
    fromAngle: ANCHORS.solarExitToBattery,
    to: NODE_IDS.battery,
    toAngle: ANCHORS.batteryEntryFromSolar,
    kind: "solarToBattery",
    color: style.palette.batteryIn,
  });
  add({
    from: NODE_IDS.solar,
    fromAngle: hasExportNode ? ANCHORS.solarExitToExport : ANCHORS.solarExitToGrid,
    to: hasExportNode ? NODE_IDS.export : NODE_IDS.grid,
    toAngle: hasExportNode ? ANCHORS.exportEntryFromSolar : ANCHORS.gridEntryFromSolar,
    kind: "solarToGrid",
    color: style.palette.gridExport,
  });
  add({
    from: NODE_IDS.solar,
    fromAngle: ANCHORS.solarExitToHome,
    to: NODE_IDS.home,
    toAngle: ANCHORS.homeEntryFromSolar,
    kind: "solarToHome",
    color: style.palette.solar,
  });

  // Grid to home.
  add({
    from: NODE_IDS.grid,
    fromAngle: ANCHORS.gridExitToHome,
    to: NODE_IDS.home,
    toAngle: ANCHORS.homeEntryFromGrid,
    kind: "gridToHome",
    color: style.palette.gridImport,
  });

  // Battery to home.
  add({
    from: NODE_IDS.battery,
    fromAngle: ANCHORS.batteryExitToHome,
    to: NODE_IDS.home,
    toAngle: ANCHORS.homeEntryFromBattery,
    kind: "batteryToHome",
    color: style.palette.batteryOut,
  });

  if (hasExportNode) {
    // Battery discharge that leaves the property gets its own short hop across
    // the bottom row, rather than sharing the import line.
    add({
      from: NODE_IDS.battery,
      fromAngle: ANCHORS.batteryExitToExport,
      to: NODE_IDS.export,
      toAngle: ANCHORS.exportEntryFromBattery,
      kind: "batteryToGrid",
      color: style.palette.gridExport,
    });
  }

  // The battery/grid exchange shares one line whichever way it runs, matching
  // the reference card's single `#battery-grid` path. With an export node in
  // play the outbound half has already been drawn above, so this line carries
  // grid → battery only.
  const exchange = buildExchange(args, !hasExportNode);
  if (exchange) edges.push(exchange);

  // Individual loads drop into the home node.
  for (const i of visibleLoadIndexes) {
    const load = loads[i]!;
    add({
      from: nodeId("individual", i),
      fromAngle: ANCHORS.individualExit,
      to: NODE_IDS.home,
      toAngle: ANCHORS.homeEntryFromIndividual,
      kind: "individual",
      color: load.color ?? individualColor(style.palette, i),
      individualIndex: i,
      // A load that feeds back into the house (e.g. a V2G-capable charger)
      // reverses its dot rather than getting its own reversed route.
      reversed: load.invertAnimation ?? false,
    });
  }

  return edges;
}

function buildExchange(args: FlowRouteArgs, includeBatteryToGrid: boolean): FlowEdge | null {
  const { layout, style, solution } = args;
  const peak = peakFlow(solution);
  const batteryRect = rectOf(layout, NODE_IDS.battery);
  const gridRect = rectOf(layout, NODE_IDS.grid);
  if (!batteryRect || !gridRect) return null;

  const toBattery = solution.gridToBattery;
  const toGrid = includeBatteryToGrid ? solution.batteryToGrid : 0;
  const active = toBattery > 0 || toGrid > 0;
  if (!active && style.inactiveLineMode === "hide") return null;

  // Drawn battery -> grid; a grid -> battery flow simply runs its dot backwards
  // along the same line.
  const path = connect(
    style,
    batteryRect,
    ANCHORS.batteryExitToGrid,
    gridRect,
    ANCHORS.gridEntryFromBattery,
  );
  if (!pathIsFinite(path)) return null;

  const color = toBattery > 0 ? style.palette.gridImport : style.palette.gridExport;

  const dots: FlowDot[] = [];
  if (style.showDots) {
    if (toGrid > 0) {
      dots.push({
        kind: "batteryToGrid",
        individualIndex: 0,
        color: style.palette.gridExport,
        durationMs: durationFor(style.flowRate, toGrid, solution.totalLines, peak),
        reversed: false,
        phaseKey: "batteryToGrid",
      });
    }
    if (toBattery > 0) {
      dots.push({
        kind: "gridToBattery",
        individualIndex: 0,
        color: style.palette.gridImport,
        durationMs: durationFor(style.flowRate, toBattery, solution.totalLines, peak),
        reversed: true,
        phaseKey: "gridToBattery",
      });
    }
  }

  return {
    id: "batteryGridExchange",
    path,
    length: pathLength(path),
    color: lineColor(style, color, active),
    isActive: active,
    dots,
  };
}
