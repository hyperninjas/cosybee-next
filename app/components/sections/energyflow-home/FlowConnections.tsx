import type { EnergyFlowSnapshot } from "./types";

/**
 * The dashed lines that connect Solar/Battery/Grid/Home to the central "Net"
 * hub. Rendered as a single absolutely-positioned SVG behind the ring nodes.
 * Line color intensifies with actual flow direction so an idle channel reads
 * as background structure rather than false telemetry.
 *
 * Colors come from theme tokens (`--efh-*` and `--muted`) via `currentColor`
 * indirection: each line's `stroke` is set to a CSS variable, so re-theming
 * the palette re-themes the diagram.
 */

export function FlowConnections({ flow }: { flow: EnergyFlowSnapshot }) {
  const solarActive = flow.solar.direction !== "idle";
  const batteryActive = flow.battery.direction !== "idle";
  const gridActive = flow.grid.direction !== "idle";
  const homeActive = flow.home.direction !== "idle";

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 520 360"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Solar → hub */}
      <line
        x1="260"
        y1="72"
        x2="260"
        y2="150"
        stroke={solarActive ? "var(--efh-solar)" : "var(--muted)"}
        strokeOpacity={solarActive ? 0.7 : 0.3}
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      {/* Battery → hub */}
      <line
        x1="96"
        y1="180"
        x2="220"
        y2="180"
        stroke={batteryActive ? "var(--efh-battery)" : "var(--muted)"}
        strokeOpacity={batteryActive ? 0.8 : 0.3}
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      {/* Grid → hub */}
      <line
        x1="300"
        y1="180"
        x2="424"
        y2="180"
        stroke={gridActive ? "var(--efh-grid)" : "var(--muted)"}
        strokeOpacity={gridActive ? 0.7 : 0.3}
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      {/* Hub → Home */}
      <line
        x1="260"
        y1="210"
        x2="260"
        y2="288"
        stroke={homeActive ? "var(--efh-home)" : "var(--muted)"}
        strokeOpacity={homeActive ? 0.7 : 0.3}
        strokeWidth="2"
        strokeDasharray="4 4"
      />
    </svg>
  );
}
