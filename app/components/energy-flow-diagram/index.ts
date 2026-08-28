/**
 * An animated energy flow diagram: solar, grid, battery, home, low-carbon and
 * an arbitrary number of individual loads, connected by animated flow lines.
 *
 * The distribution maths is a port of the allocation algorithm used by the
 * Home Assistant `energy-flow-card-plus` Lovelace card (v0.2.3), by way of the
 * `energy_flow_diagram` Flutter package. Pure TypeScript, no Home Assistant
 * coupling. See `solve`.
 *
 * The rendering layer is shape-agnostic: nodes may be circles, hexagons or any
 * custom `EnergyNodeShape`, and the segmented consumption ring on the home node
 * follows the node outline whatever that outline is.
 */

// ── Model ───────────────────────────────────────────────────────────────────
export type {
  EnergyFlowInput,
  SignedEnergyFlowInput,
} from "./model/input";
export {
  fromSigned,
  hasBattery,
  hasExportNode,
  hasGrid,
  hasLowCarbon,
  hasSolar,
  nonFossilPercentageFromHighCarbon,
} from "./model/input";

export type { EnergyFlowSolution, HomeRingShares } from "./model/solution";
export {
  EMPTY_RING,
  flowValue,
  homeRingShares,
  lerpRing,
  ringIsEmpty,
  solve,
} from "./model/solution";

export type {
  EnergyFlowKind,
  EnergyNodeId,
  EnergyNodeKind,
  IndividualLoad,
  Point,
  Rect,
} from "./model/types";
export { NODE_IDS, loadIsVisible, nodeId, nodeKey, rect } from "./model/types";

export type { FlowRate, FlowRateModel } from "./model/flowRate";
export { DEFAULT_FLOW_RATE, durationFor, mapRange } from "./model/flowRate";

export type { ValueFormat, ValueUnits } from "./model/valueFormat";
export {
  DEFAULT_FORMAT,
  KILOWATTS,
  KILOWATT_HOURS,
  WATTS,
  WATT_HOURS,
  formatValue,
  kilowattHoursFormat,
  kilowattsFormat,
  wattsFormat,
} from "./model/valueFormat";

// ── Render ──────────────────────────────────────────────────────────────────
export type {
  EnergyFlowPalette,
  EnergyFlowStyle,
  InactiveLineMode,
  Size,
} from "./render/style";
export {
  DEFAULT_PALETTE,
  DEFAULT_STYLE,
  effectiveHomeNodeSize,
  individualColor,
  resolveStyle,
  scaleStyle,
  withAlpha,
} from "./render/style";

export type { EnergyNodeShape, HexagonOrientation } from "./render/nodeShape";
export {
  NODE_SHAPES,
  circleNodeShape,
  hexagonNodeShape,
  polygonNodeShape,
} from "./render/nodeShape";

export type { ComputeLayoutArgs, EnergyFlowLayout } from "./render/computeLayout";
export { computeLayout, labelRectOf, layoutHas, rectOf } from "./render/computeLayout";

export type { FlowDot, FlowEdge, FlowRouteArgs } from "./render/flowRoute";
export { buildEdges } from "./render/flowRoute";

// ── Components ──────────────────────────────────────────────────────────────
export type {
  EnergyFlowDiagramProps,
  EnergyNodeConfig,
} from "./components/EnergyFlowDiagram";
export { EnergyFlowDiagram } from "./components/EnergyFlowDiagram";

export type { EnergyNodeLine, EnergyNodeViewProps } from "./components/EnergyNodeView";
export { EnergyNodeView } from "./components/EnergyNodeView";

export type { FlowLinesProps } from "./components/FlowLines";
export { FlowLines } from "./components/FlowLines";

export type { IconProps } from "./components/icons";
export {
  ArrowBackIcon,
  ArrowDownwardIcon,
  ArrowForwardIcon,
  ArrowOutwardIcon,
  ArrowUpwardIcon,
  Battery1BarIcon,
  Battery3BarIcon,
  Battery5BarIcon,
  BatteryFullIcon,
  EcoIcon,
  EvStationIcon,
  GridIcon,
  HomeIcon,
  PowerOffIcon,
  SolarIcon,
  batteryIconFor,
} from "./components/icons";
