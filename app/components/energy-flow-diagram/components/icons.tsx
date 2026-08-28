"use client";
"use no memo";

/**
 * Stand-ins for the Material icons the Flutter package names by identifier.
 *
 * Kept as inline SVG rather than a dependency so the package stays
 * self-contained: a diagram that needs an icon font to render is not
 * plug-and-play. Every one is overridable per node via `icon`, so a host app
 * with its own icon set never has to use these.
 *
 * All drawn on a 24×24 grid and sized by `width`/`height`, matching
 * `style.iconSize`.
 */
import type { CSSProperties, ReactNode } from "react";

export interface IconProps {
  readonly size?: number;
  readonly color?: string;
  readonly style?: CSSProperties;
}

const svg = (path: ReactNode, viewBox = "0 0 24 24") =>
  function Icon({ size = 24, color = "currentColor", style }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill={color}
        aria-hidden="true"
        focusable="false"
        style={{ display: "block", flexShrink: 0, ...style }}
      >
        {path}
      </svg>
    );
  };

/** `Icons.electrical_services` — the grid node's default. */
export const GridIcon = svg(
  <path d="M15 6h-2V2h-2v4H9V2H7v4H5v6h6v9h2v-9h6V6h-2V2h-2v4zm2 4H7V8h10v2z" />,
);

/** `Icons.power_off_outlined` — the grid node during an outage. */
export const PowerOffIcon = svg(
  <path d="M3.4 2.1 2 3.5l4 4V13c0 2.6 1.9 4.7 4.4 5v4h3.2v-4c.6-.1 1.2-.3 1.7-.6l4.2 4.2 1.4-1.4L3.4 2.1zM8 9.5l5.6 5.6c-.5.3-1 .4-1.6.4-1.7 0-3-1.3-3-3V9.5zM16 13V7h-2V3h-2v4h-1.2l6.9 6.9c.2-.3.3-.6.3-.9z" />,
);

/** `Icons.arrow_outward` — the export node. */
export const ArrowOutwardIcon = svg(
  <path d="M6 6v2h8.59L5 17.59 6.41 19 16 9.41V18h2V6H6z" />,
);

/** `Icons.solar_power`. */
export const SolarIcon = svg(
  <path d="M11 5V1h2v4h-2zM4.6 7.4 1.8 4.6 3.2 3.2 6 6 4.6 7.4zM19.4 7.4 18 6l2.8-2.8 1.4 1.4-2.8 2.8zM3 11H1V9h2v2zM23 11h-2V9h2v2zM12 8c-3.9 0-7 3.1-7 7h14c0-3.9-3.1-7-7-7zm-4.7 5c.6-1.8 2.5-3 4.7-3s4.1 1.2 4.7 3H7.3zM2 17h20v2H2v-2zM6 21h12v2H6v-2z" />,
);

/** `Icons.home_outlined`. */
export const HomeIcon = svg(
  <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 7.8V18h-2v-6H9v6H7v-7.2l5-4.5 5 4.5z" />,
);

/** `Icons.eco_outlined` — the low-carbon node. */
export const EcoIcon = svg(
  <path d="M6.05 8.05a7 7 0 0 0-.02 9.88c1.47-3.4 4.09-6.24 7.36-7.93A15.9 15.9 0 0 0 8.3 19.1a7 7 0 0 0 9.65-9.65C15.4 6.9 10.6 5.5 6.05 8.05z" />,
);

/** `Icons.ev_station_outlined` — an individual load's default. */
export const EvStationIcon = svg(
  <path d="M14.5 11l-3 6v-4h-2l3-6v4h2zM19.8 7.2 16.9 4.3l-1.1 1.1 1.6 1.6c-.7.3-1.2 1-1.2 1.8V19c0 .6-.4 1-1 1s-1-.4-1-1v-4c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v16h8v-6.5h1.5V19c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5V8.8c0-.4.3-.8.8-.8s.8.3.8.8V12h2V8.8c0-.6-.2-1.2-.6-1.6zM9 19H5V5h4v14z" />,
);

const batteryBody = (fillFrom: number) => (
  <>
    <path d="M15.7 4H14V2h-4v2H8.3C7.6 4 7 4.6 7 5.3v15.4c0 .7.6 1.3 1.3 1.3h7.4c.7 0 1.3-.6 1.3-1.3V5.3C17 4.6 16.4 4 15.7 4zM15 20H9V6h6v14z" />
    <rect x="9" y={fillFrom} width="6" height={20 - fillFrom} />
  </>
);

/** `Icons.battery_full`. */
export const BatteryFullIcon = svg(batteryBody(6));
/** `Icons.battery_5_bar`. */
export const Battery5BarIcon = svg(batteryBody(9.5));
/** `Icons.battery_3_bar`. */
export const Battery3BarIcon = svg(batteryBody(13));
/** `Icons.battery_1_bar`. */
export const Battery1BarIcon = svg(batteryBody(16.5));

/** Direction arrows used inside node value rows. */
export const ArrowForwardIcon = svg(
  <path d="M12 4l-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20l8-8-8-8z" />,
);
export const ArrowBackIcon = svg(
  <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2z" />,
);
export const ArrowDownwardIcon = svg(
  <path d="M20 12l-1.4-1.4-5.6 5.6V4h-2v12.2l-5.6-5.6L4 12l8 8 8-8z" />,
);
export const ArrowUpwardIcon = svg(
  <path d="M4 12l1.4 1.4L11 7.8V20h2V7.8l5.6 5.6L20 12l-8-8-8 8z" />,
);

/**
 * Mirrors the reference card's state-of-charge icon thresholds.
 *
 * The exact same four bands as the Flutter package's `_batteryIcon`.
 */
export function batteryIconFor(stateOfCharge: number | undefined): (p: IconProps) => ReactNode {
  if (stateOfCharge === undefined) return BatteryFullIcon;
  if (stateOfCharge <= 16) return Battery1BarIcon;
  if (stateOfCharge <= 44) return Battery3BarIcon;
  if (stateOfCharge <= 72) return Battery5BarIcon;
  return BatteryFullIcon;
}
