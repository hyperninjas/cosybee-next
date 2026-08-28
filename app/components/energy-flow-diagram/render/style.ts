import { DEFAULT_FLOW_RATE, type FlowRate } from "../model/flowRate";
import { DEFAULT_FORMAT, type ValueFormat } from "../model/valueFormat";
import { hexagonNodeShape, type EnergyNodeShape } from "./nodeShape";

/** How lines carrying no energy are drawn. */
export type InactiveLineMode =
  /** Draw them at full strength. */
  | "show"
  /** Omit them entirely. */
  | "hide"
  /** Draw them faded, using `inactiveOpacity`. */
  | "fade"
  /** Draw them in `inactiveColor`. */
  | "grey";

/** A width/height pair. Mirrors Flutter's `Size`. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * The colours used across the diagram.
 *
 * Defaults reproduce the Home Assistant energy palette.
 */
export interface EnergyFlowPalette {
  /** Energy drawn from the grid. */
  readonly gridImport: string;
  /** Energy returned to the grid. */
  readonly gridExport: string;
  readonly solar: string;
  /** Energy entering the battery. */
  readonly batteryIn: string;
  /** Energy leaving the battery. */
  readonly batteryOut: string;
  readonly lowCarbon: string;
  /** Cycled through for individual loads. */
  readonly individuals: readonly string[];
}

export const DEFAULT_PALETTE: EnergyFlowPalette = {
  gridImport: "#488FC2",
  gridExport: "#A280DB",
  solar: "#FF9800",
  batteryIn: "#F06292",
  batteryOut: "#4DB6AC",
  lowCarbon: "#0F9D58",
  individuals: ["#D0CC5B", "#964CB5"],
};

/** Colour for the individual load at `index`, cycling if there are more loads. */
export function individualColor(palette: EnergyFlowPalette, index: number): string {
  if (palette.individuals.length === 0) return palette.gridImport;
  return palette.individuals[index % palette.individuals.length]!;
}

/** Everything about how the diagram looks and animates. */
export interface EnergyFlowStyle {
  /** Outline used for every node. */
  readonly shape: EnergyNodeShape;
  readonly palette: EnergyFlowPalette;
  readonly format: ValueFormat;
  /** Magnitude-to-duration mapping for the animated dots. */
  readonly flowRate: FlowRate;
  readonly nodeSize: Size;
  /** Size of the home node. Defaults to `nodeSize`. */
  readonly homeNodeSize?: Size;
  /** Horizontal gap between nodes in the same row. */
  readonly nodeSpacing: number;
  /** Vertical gap between rows. */
  readonly rowSpacing: number;
  /**
   * Widest the diagram will draw itself, regardless of available space. It
   * centres within anything wider, so it stays readable on tablets and in
   * landscape. Pass null to always fill the available width.
   *
   * Defaults to 470, matching the reference card's `max-width`.
   */
  readonly maxWidth: number | null;
  /**
   * Floor for the automatic shrink applied when the available width cannot fit
   * the widest row at full size. Below this the diagram is allowed to overflow
   * rather than become illegible.
   */
  readonly minScale: number;
  readonly borderWidth: number;
  /** Thickness of the segmented ring on the home node. */
  readonly ringWidth: number;
  /**
   * Where the ring starts, as a fraction of the perimeter. Useful with
   * polygonal nodes to move segment boundaries off the corners.
   */
  readonly ringStartFraction: number;
  readonly lineWidth: number;
  /** Radius of the travelling dot. */
  readonly dotRadius: number;
  readonly inactiveLineMode: InactiveLineMode;
  readonly inactiveOpacity: number;
  readonly inactiveColor: string;
  /**
   * Whether travelling dots are drawn at all. Turning them off stops the
   * diagram's animation entirely.
   */
  readonly showDots: boolean;
  /** CSS for the label under each node. */
  readonly labelStyle?: React.CSSProperties;
  /** CSS for the value inside each node. */
  readonly valueStyle?: React.CSSProperties;
  /** CSS for the secondary value inside each node. */
  readonly secondaryStyle?: React.CSSProperties;
  readonly iconSize: number;
  /** Fill behind each node. Transparent when undefined. */
  readonly nodeBackgroundColor?: string;
  /** Font size used to reserve label room; mirrors Flutter's text metrics. */
  readonly labelFontSize: number;
}

export const DEFAULT_STYLE: EnergyFlowStyle = {
  shape: hexagonNodeShape(),
  palette: DEFAULT_PALETTE,
  format: DEFAULT_FORMAT,
  flowRate: DEFAULT_FLOW_RATE,
  nodeSize: { width: 80, height: 80 },
  nodeSpacing: 24,
  rowSpacing: 42,
  maxWidth: 470,
  minScale: 0.55,
  borderWidth: 2,
  ringWidth: 4,
  ringStartFraction: 0,
  lineWidth: 1.4,
  dotRadius: 3.2,
  inactiveLineMode: "fade",
  inactiveOpacity: 0.35,
  inactiveColor: "#BDBDBD",
  showDots: true,
  iconSize: 22,
  labelFontSize: 12,
};

/** The effective home node size. */
export const effectiveHomeNodeSize = (style: EnergyFlowStyle): Size =>
  style.homeNodeSize ?? style.nodeSize;

/** Merges partial overrides over the defaults, as Flutter's `copyWith` does. */
export function resolveStyle(overrides?: Partial<EnergyFlowStyle>): EnergyFlowStyle {
  if (!overrides) return DEFAULT_STYLE;
  return {
    ...DEFAULT_STYLE,
    ...overrides,
    palette: { ...DEFAULT_PALETTE, ...(overrides.palette ?? {}) },
    format: { ...DEFAULT_FORMAT, ...(overrides.format ?? {}) },
    flowRate: { ...DEFAULT_FLOW_RATE, ...(overrides.flowRate ?? {}) },
  };
}

/**
 * Scales strokes, dots and icons with the nodes, so a compressed diagram keeps
 * its proportions instead of looking heavy-handed.
 */
export function scaleStyle(style: EnergyFlowStyle, scale: number): EnergyFlowStyle {
  if (scale === 1) return style;
  return {
    ...style,
    borderWidth: style.borderWidth * scale,
    ringWidth: style.ringWidth * scale,
    lineWidth: style.lineWidth * scale,
    dotRadius: style.dotRadius * scale,
    iconSize: style.iconSize * scale,
  };
}

/**
 * Applies an alpha to a colour, for the `fade` inactive mode.
 *
 * 🔴 Handles more than `#rrggbb`, because silently returning the colour
 * unchanged is worse than it looks: `fade` is the DEFAULT inactive mode, so a
 * palette given in any other notation would draw its inactive lines at full
 * strength — indistinguishable from an active flow. The bug would read as
 * "the diagram shows energy flowing where there is none".
 *
 * Falls back to `color-mix`, which every engine supporting this package
 * understands, so an unrecognised notation still fades rather than not fading.
 */
export function withAlpha(color: string, alpha: number): string {
  const a = Number.isFinite(alpha) ? Math.min(Math.max(alpha, 0), 1) : 1;
  if (a >= 1) return color;

  const hex = color.trim();

  // #rgb / #rgba
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i.exec(hex);
  if (short) {
    const [, r, g, b, existing] = short;
    const base = existing === undefined ? 1 : Number.parseInt(existing + existing, 16) / 255;
    return `#${r}${r}${g}${g}${b}${b}${channel(base * a)}`;
  }

  // #rrggbb / #rrggbbaa — an existing alpha is multiplied, not discarded.
  const long = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (long) {
    const [, rgb, existing] = long;
    const base = existing === undefined ? 1 : Number.parseInt(existing, 16) / 255;
    return `#${rgb}${channel(base * a)}`;
  }

  // rgb() / rgba(), in either the legacy comma form or the modern space form.
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(hex);
  if (rgb) {
    const parts = rgb[1]!.split(/[\s,/]+/).filter((p) => p.length > 0);
    if (parts.length >= 3) {
      const base = parts.length >= 4 ? Number.parseFloat(parts[3]!) : 1;
      const scaled = (Number.isFinite(base) ? base : 1) * a;
      return `rgb(${parts[0]} ${parts[1]} ${parts[2]} / ${round3(scaled)})`;
    }
  }

  // A named colour, a custom property, an lab()/oklch() — anything at all.
  return `color-mix(in srgb, ${color} ${round3(a * 100)}%, transparent)`;
}

const channel = (fraction: number): string =>
  Math.round(Math.min(Math.max(fraction, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
