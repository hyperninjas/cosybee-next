/**
 * Identifies one of the fixed nodes in the diagram.
 *
 * Individual loads are identified separately by their index, because there may
 * be an arbitrary number of them.
 */
export type EnergyNodeKind =
  /** Grid import/export node. Import-only when `export` is also drawn. */
  | "grid"
  /**
   * Grid export — energy leaving the property, drawn as a destination in its
   * own right rather than a reverse arrow on `grid`. Opt in via
   * `showExportNode`.
   */
  | "export"
  | "solar"
  | "battery"
  /** Home consumption — the node carrying the segmented ring. */
  | "home"
  /** Low-carbon / non-fossil share of the grid import. */
  | "lowCarbon"
  | "individual";

/** Identifies one edge of the diagram, i.e. one animated flow line. */
export type EnergyFlowKind =
  | "gridToHome"
  | "gridToBattery"
  | "solarToHome"
  | "solarToGrid"
  | "solarToBattery"
  | "batteryToHome"
  | "batteryToGrid"
  | "individual";

/** A point. Mirrors Flutter's `Offset`. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * A rectangle in the diagram's coordinate space, mirroring Flutter's `Rect`.
 *
 * Y grows DOWNWARD and angles increase clockwise from "right", matching both
 * Flutter's canvas and SVG's — which is why every angle constant ports across
 * unchanged.
 */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
});

export const centerOf = (r: Rect): Point => ({
  x: r.x + r.width / 2,
  y: r.y + r.height / 2,
});

export const rightOf = (r: Rect): number => r.x + r.width;
export const bottomOf = (r: Rect): number => r.y + r.height;
export const longestSide = (r: Rect): number => Math.max(r.width, r.height);

export const translate = (r: Rect, dx: number, dy: number): Rect => ({
  ...r,
  x: r.x + dx,
  y: r.y + dy,
});

export const distance = (a: Point, b: Point): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

/** A user-configured individual load, e.g. an EV charger or a heat pump. */
export interface IndividualLoad {
  /** Consumption, in the same unit as every other value on the input. */
  readonly value: number;
  /** Label rendered under the node. */
  readonly label?: string;
  /** Rendered inside the node. Any React node — an icon component, an emoji. */
  readonly icon?: React.ReactNode;
  /** Node colour. Falls back to the palette's individual colours by index. */
  readonly color?: string;
  /** Overrides the unit used when formatting `value`. */
  readonly unit?: string;
  /** Overrides the decimal count used when formatting `value`. */
  readonly decimals?: number;
  /** Reverses the direction the animated dot travels. */
  readonly invertAnimation?: boolean;
  /** Keeps the node visible even when `value` is zero. */
  readonly displayZero?: boolean;
  /** Values at or below this are treated as zero. */
  readonly displayZeroTolerance?: number;
}

/** Whether a load should be rendered at all. */
export const loadIsVisible = (load: IndividualLoad): boolean =>
  (load.displayZero ?? false) || load.value > (load.displayZeroTolerance ?? 0);

/**
 * Identifies one node. Individual loads are distinguished by `index`; every
 * other kind uses index zero.
 */
export interface EnergyNodeId {
  readonly kind: EnergyNodeKind;
  readonly index: number;
}

export const nodeId = (kind: EnergyNodeKind, index = 0): EnergyNodeId => ({ kind, index });

/**
 * A string key for map lookups.
 *
 * TypeScript has no value equality for object keys, so identity is carried in a
 * string rather than in the object — the direct equivalent of the Dart class's
 * `operator ==` / `hashCode` pair.
 */
export const nodeKey = (id: EnergyNodeId): string =>
  id.kind === "individual" ? `individual:${id.index}` : id.kind;

export const NODE_IDS = {
  grid: nodeId("grid"),
  export: nodeId("export"),
  solar: nodeId("solar"),
  battery: nodeId("battery"),
  home: nodeId("home"),
  lowCarbon: nodeId("lowCarbon"),
} as const;
