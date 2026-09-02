"use client";
"use no memo";

import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import {
  hasBattery as inputHasBattery,
  hasExportNode as inputHasExportNode,
  hasGrid as inputHasGrid,
  hasLowCarbon as inputHasLowCarbon,
  hasSolar as inputHasSolar,
  type EnergyFlowInput,
} from "../model/input";
import { flowValue, homeRingShares, solve } from "../model/solution";
import { formatValue } from "../model/valueFormat";
import { nonNegative, positive } from "../model/finite";
import { NODE_IDS, loadIsVisible, nodeId, type EnergyNodeId, type Rect } from "../model/types";
import { buildEdges } from "../render/flowRoute";
import { computeLayout, labelRectOf, layoutHas, rectOf } from "../render/computeLayout";
import {
  individualColor,
  resolveStyle,
  scaleStyle,
  type EnergyFlowStyle,
} from "../render/style";
import { EnergyNodeView, type EnergyNodeLine } from "./EnergyNodeView";
import { FlowLines } from "./FlowLines";
import {
  ArrowBackIcon,
  ArrowDownwardIcon,
  ArrowForwardIcon,
  ArrowOutwardIcon,
  ArrowUpwardIcon,
  EcoIcon,
  EvStationIcon,
  GridIcon,
  HomeIcon,
  PowerOffIcon,
  SolarIcon,
  batteryIconFor,
} from "./icons";
import { useAnimatedRing } from "./useAnimatedRing";
import { useMeasuredWidth } from "./useMeasuredWidth";

/** Per-node presentation overrides. */
export interface EnergyNodeConfig {
  /** Label under the node. Falls back to a built-in English default. */
  readonly label?: string;
  /** Rendered inside the node. */
  readonly icon?: ReactNode;
  /** Small line rendered above the icon. */
  readonly secondary?: string;
  /** Called when the node is tapped. */
  readonly onTap?: () => void;
  /**
   * Word for energy flowing INTO this node, e.g. battery charge.
   *
   * 🔴 A bare arrow beside a battery is genuinely ambiguous: a downward arrow
   * reads as "charging down into the battery" to one person and as "level
   * dropping" to another. A reader of this diagram misread `↑ 50 W` (discharge)
   * as charging, and was then puzzled that a battery at 100 % was still
   * filling. The arrow and the colour cannot carry the direction alone.
   *
   * Supplied by the caller rather than defaulted to English, because this
   * package has no localisation. Absent keeps the arrow-only rendering.
   */
  readonly inLabel?: string;
  /** Word for energy flowing OUT of this node, e.g. battery discharge. */
  readonly outLabel?: string;
}

export interface EnergyFlowDiagramProps {
  /** The readings to display. */
  readonly input: EnergyFlowInput;
  /** Visual configuration. Merged over the defaults. */
  readonly style?: Partial<EnergyFlowStyle>;
  readonly grid?: EnergyNodeConfig;
  /** Only drawn when `input.showExportNode` is set. */
  readonly export?: EnergyNodeConfig;
  readonly solar?: EnergyNodeConfig;
  readonly battery?: EnergyNodeConfig;
  readonly home?: EnergyNodeConfig;
  readonly lowCarbon?: EnergyNodeConfig;
  /** How long the home ring takes to morph when readings change. */
  readonly transitionDurationMs?: number;
  /**
   * Fixes the layout width instead of measuring the container.
   *
   * Stands in for a tight `BoxConstraints`. Useful for SSR and snapshot tests,
   * where there is nothing to measure.
   */
  readonly width?: number;
  readonly className?: string;
  readonly containerStyle?: CSSProperties;
}

const EMPTY_CONFIG: EnergyNodeConfig = {};

/**
 * An animated energy flow diagram.
 *
 * Give it readings via `input`; the component solves the distribution, lays the
 * nodes out for the width it is given, and animates a dot along each active
 * flow at a speed derived from that flow's magnitude.
 *
 * ```tsx
 * <EnergyFlowDiagram
 *   input={fromSigned({
 *     gridPower: -1.2,      // exporting 1.2 kW
 *     solarProduction: 4.0,
 *     batteryPower: -0.8,   // charging at 0.8 kW
 *     batteryStateOfCharge: 64,
 *   })}
 *   style={{ format: kilowattsFormat() }}
 * />
 * ```
 */
export function EnergyFlowDiagram({
  input,
  style: styleOverrides,
  grid = EMPTY_CONFIG,
  export: exportConfig = EMPTY_CONFIG,
  solar = EMPTY_CONFIG,
  battery = EMPTY_CONFIG,
  home = EMPTY_CONFIG,
  lowCarbon = EMPTY_CONFIG,
  transitionDurationMs = 400,
  width: fixedWidth,
  className,
  containerStyle,
}: EnergyFlowDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measured = useMeasuredWidth(containerRef);

  const baseStyle = useMemo(() => resolveStyle(styleOverrides), [styleOverrides]);

  const solution = useMemo(() => solve(input), [input]);

  // A load configured with display_zero disabled and no throughput is hidden
  // entirely, matching the reference card. Original indexes are carried through
  // so colours and labels stay attached to the right load.
  const individuals = input.individuals ?? [];
  const visibleLoads = useMemo(
    () => individuals.map((_, i) => i).filter((i) => loadIsVisible(individuals[i]!)),
    [individuals],
  );

  // 🔴 Guarded, and in this order. `fixedWidth` is a caller's number and can be
  // NaN (a width parsed out of a string, a stale measurement); `measured` is 0
  // until the container has been laid out, and 0 would collapse every node.
  // A width that cannot be used falls back to the Dart widget's own unbounded
  // placeholder rather than rendering an empty box.
  const placeholder = positive(baseStyle.nodeSize.width, 80) * 4;
  const width = positive(fixedWidth, positive(measured, placeholder));

  // Reserve label room from the font size, as the Dart widget does from the real
  // text metrics. 1.5 is the same multiplier.
  const labelHeight = nonNegative(baseStyle.labelFontSize, 12) * 1.5;

  const layout = useMemo(
    () =>
      computeLayout({
        availableWidth: width,
        style: baseStyle,
        hasGrid: inputHasGrid(input),
        hasSolar: inputHasSolar(input),
        hasBattery: inputHasBattery(input),
        hasLowCarbon: inputHasLowCarbon(input),
        individualIndexes: visibleLoads,
        hasExport: inputHasExportNode(input),
        labelHeight,
      }),
    [width, baseStyle, input, visibleLoads, labelHeight],
  );

  // Strokes, dots and icons shrink with the nodes so a compressed diagram keeps
  // its proportions instead of looking heavy-handed.
  const style = useMemo(() => scaleStyle(baseStyle, layout.scale), [baseStyle, layout.scale]);

  const edges = useMemo(
    () =>
      buildEdges({
        layout,
        style,
        solution,
        loads: individuals,
        visibleLoadIndexes: visibleLoads,
      }),
    [layout, style, solution, individuals, visibleLoads],
  );

  const ring = useAnimatedRing(homeRingShares(solution), transitionDurationMs);

  const format = (value: number, options?: { unit?: string; decimals?: number }): string =>
    formatValue(style.format, value, options ?? {});

  // The diagram's own height can never be negative or unusable, or the container
  // collapses and nothing is visible even though every node was positioned.
  const height = nonNegative(layout.size.height, 0);

  /** `"50 W in"`, or just `"50 W"` when the caller supplied no direction word. */
  const directed = (value: string, word: string | undefined): string =>
    word === undefined || word.length === 0 ? value : `${value} ${word}`;

  const iconProps = { size: style.iconSize };
  const arrowSize = 12;

  const nodes: ReactNode[] = [];

  const place = (
    id: EnergyNodeId,
    view: ReactNode,
    label: string,
    key: string,
  ): void => {
    const r = rectOf(layout, id);
    if (!r) return;
    nodes.push(
      <div
        key={`node:${key}`}
        // Identifies the positioned boxes for tests and for host apps that want
        // to anchor their own overlays; carries no styling.
        data-node={key}
        style={{ position: "absolute", left: r.x, top: r.y, width: r.width, height: r.height }}
      >
        {view}
      </div>,
    );
    const labelRect = labelRectOf(layout, id);
    if (labelRect) nodes.push(renderLabel(labelRect, label, style, `label:${key}`));
  };

  // ── Grid ──────────────────────────────────────────────────────────────────
  if (layoutHas(layout, NODE_IDS.grid)) {
    const outage = input.isPowerOutage ?? false;
    const lines: EnergyNodeLine[] = outage
      ? [{ text: grid.label ?? "Outage", color: style.palette.gridImport }]
      : [
          // The reverse arrow is the *fallback* presentation of export. Once
          // export has a node of its own, repeating it here would give the same
          // energy two places to be.
          ...(input.gridExport !== undefined && !layoutHas(layout, NODE_IDS.export)
            ? [
                {
                  icon: <ArrowBackIcon size={arrowSize} color={style.palette.gridExport} />,
                  text: format(solution.gridExport),
                  color: style.palette.gridExport,
                },
              ]
            : []),
          {
            icon: <ArrowForwardIcon size={arrowSize} color={style.palette.gridImport} />,
            text: format(solution.gridImport),
            color: style.palette.gridImport,
          },
        ];

    const r = rectOf(layout, NODE_IDS.grid)!;
    place(
      NODE_IDS.grid,
      <EnergyNodeView
        style={style}
        width={r.width}
        height={r.height}
        borderColor={style.palette.gridImport}
        icon={
          grid.icon ??
          (outage ? (
            <PowerOffIcon {...iconProps} color={style.palette.gridImport} />
          ) : (
            <GridIcon {...iconProps} color={style.palette.gridImport} />
          ))
        }
        {...(grid.secondary !== undefined ? { secondary: grid.secondary } : {})}
        {...(grid.onTap !== undefined ? { onTap: grid.onTap } : {})}
        ariaLabel={grid.label ?? "Grid"}
        lines={lines}
      />,
      grid.label ?? "Grid",
      "grid",
    );
  }

  // ── Export ────────────────────────────────────────────────────────────────
  if (layoutHas(layout, NODE_IDS.export)) {
    const r = rectOf(layout, NODE_IDS.export)!;
    place(
      NODE_IDS.export,
      <EnergyNodeView
        style={style}
        width={r.width}
        height={r.height}
        borderColor={style.palette.gridExport}
        icon={exportConfig.icon ?? <ArrowOutwardIcon {...iconProps} color={style.palette.gridExport} />}
        {...(exportConfig.secondary !== undefined ? { secondary: exportConfig.secondary } : {})}
        {...(exportConfig.onTap !== undefined ? { onTap: exportConfig.onTap } : {})}
        ariaLabel={exportConfig.label ?? "Export"}
        lines={[
          {
            icon: <ArrowForwardIcon size={arrowSize} color={style.palette.gridExport} />,
            text: format(solution.gridExport),
            color: style.palette.gridExport,
          },
        ]}
      />,
      exportConfig.label ?? "Export",
      "export",
    );
  }

  // ── Solar ─────────────────────────────────────────────────────────────────
  if (layoutHas(layout, NODE_IDS.solar)) {
    const r = rectOf(layout, NODE_IDS.solar)!;
    place(
      NODE_IDS.solar,
      <EnergyNodeView
        style={style}
        width={r.width}
        height={r.height}
        borderColor={style.palette.solar}
        icon={solar.icon ?? <SolarIcon {...iconProps} color={style.palette.solar} />}
        {...(solar.secondary !== undefined ? { secondary: solar.secondary } : {})}
        {...(solar.onTap !== undefined ? { onTap: solar.onTap } : {})}
        ariaLabel={solar.label ?? "Solar"}
        lines={[{ text: format(solution.solarTotal) }]}
      />,
      solar.label ?? "Solar",
      "solar",
    );
  }

  // ── Battery ───────────────────────────────────────────────────────────────
  if (layoutHas(layout, NODE_IDS.battery)) {
    const soc = input.batteryStateOfCharge;
    const BatteryIcon = batteryIconFor(soc);
    const r = rectOf(layout, NODE_IDS.battery)!;
    place(
      NODE_IDS.battery,
      <EnergyNodeView
        style={style}
        width={r.width}
        height={r.height}
        borderColor={style.palette.batteryIn}
        icon={battery.icon ?? <BatteryIcon {...iconProps} color={style.palette.batteryIn} />}
        {...(battery.secondary !== undefined
          ? { secondary: battery.secondary }
          : // 🔴 `Number.isFinite`, not just `!== undefined`. An unusable state of
            // charge rendered the literal string "NaN%" on the battery node —
            // the one number on this diagram a customer reads as a fact about
            // their hardware. Absent is the honest answer.
            Number.isFinite(soc)
            ? { secondary: `${Math.round(soc!)}%` }
            : {})}
        {...(battery.onTap !== undefined ? { onTap: battery.onTap } : {})}
        ariaLabel={battery.label ?? "Battery"}
        lines={[
          {
            icon: <ArrowUpwardIcon size={arrowSize} color={style.palette.batteryOut} />,
            text: directed(format(solution.batteryDischarge), battery.outLabel),
            color: style.palette.batteryOut,
          },
          {
            icon: <ArrowDownwardIcon size={arrowSize} color={style.palette.batteryIn} />,
            text: directed(format(solution.batteryCharge), battery.inLabel),
            color: style.palette.batteryIn,
          },
        ]}
      />,
      battery.label ?? "Battery",
      "battery",
    );
  }

  // ── Low carbon ────────────────────────────────────────────────────────────
  if (layoutHas(layout, NODE_IDS.lowCarbon)) {
    const r = rectOf(layout, NODE_IDS.lowCarbon)!;
    place(
      NODE_IDS.lowCarbon,
      <EnergyNodeView
        style={style}
        width={r.width}
        height={r.height}
        borderColor={style.palette.lowCarbon}
        icon={lowCarbon.icon ?? <EcoIcon {...iconProps} color={style.palette.lowCarbon} />}
        {...(lowCarbon.secondary !== undefined ? { secondary: lowCarbon.secondary } : {})}
        {...(lowCarbon.onTap !== undefined ? { onTap: lowCarbon.onTap } : {})}
        ariaLabel={lowCarbon.label ?? "Low carbon"}
        lines={[{ text: format(solution.nonFossilToHome) }]}
      />,
      lowCarbon.label ?? "Low carbon",
      "lowCarbon",
    );
  }

  // ── Individual loads ──────────────────────────────────────────────────────
  for (const i of visibleLoads) {
    const load = individuals[i]!;
    const id = nodeId("individual", i);
    const r = rectOf(layout, id);
    if (!r) continue;
    const color = load.color ?? individualColor(style.palette, i);
    place(
      id,
      <EnergyNodeView
        style={style}
        width={r.width}
        height={r.height}
        borderColor={color}
        icon={load.icon ?? <EvStationIcon {...iconProps} color={color} />}
        ariaLabel={load.label ?? `Load ${i + 1}`}
        lines={[
          {
            text: format(flowValue(solution, "individual", i), {
              ...(load.unit !== undefined ? { unit: load.unit } : {}),
              ...(load.decimals !== undefined ? { decimals: load.decimals } : {}),
            }),
          },
        ]}
      />,
      load.label ?? `Load ${i + 1}`,
      `individual:${i}`,
    );
  }

  // ── Home ──────────────────────────────────────────────────────────────────
  const homeRect = rectOf(layout, NODE_IDS.home);
  if (homeRect) {
    place(
      NODE_IDS.home,
      <EnergyNodeView
        style={style}
        width={homeRect.width}
        height={homeRect.height}
        // The home node carries the ring instead of a plain border.
        borderColor="#00000000"
        ringShares={ring}
        icon={home.icon ?? <HomeIcon {...iconProps} color={style.palette.gridImport} />}
        {...(home.secondary !== undefined ? { secondary: home.secondary } : {})}
        {...(home.onTap !== undefined ? { onTap: home.onTap } : {})}
        ariaLabel={home.label ?? "Home"}
        lines={[{ text: format(solution.displayedHomeConsumption) }]}
      />,
      home.label ?? "Home",
      "home",
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height, ...containerStyle }}
    >
      <FlowLines
        edges={edges}
        width={width}
        height={height}
        lineWidth={style.lineWidth}
        dotRadius={style.dotRadius}
      />
      {nodes}
    </div>
  );
}

/**
 * Renders a node's label at the position the layout chose for it.
 *
 * Top-row labels sit above their node so the downward flow lines do not run
 * through the text.
 */
function renderLabel(
  r: Rect,
  text: string,
  style: EnergyFlowStyle,
  key: string,
): ReactNode {
  return (
    <div
      key={key}
      // 🔴 Label boxes are deliberately TWICE their node's width and centred on
      // it, so a long name has room — which means they legitimately overhang
      // the diagram's edges. Marked so callers and tests can tell them from
      // node boxes, which must stay in bounds.
      data-label={key.replace(/^label:/, "")}
      style={{
        position: "absolute",
        left: r.x,
        top: r.y,
        width: r.width,
        height: r.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        fontSize: style.labelFontSize,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...style.labelStyle,
      }}
    >
      <span
        style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {text}
      </span>
    </div>
  );
}
