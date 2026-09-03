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

/**
 * Electricity pylon (transmission tower) — the grid node's default.
 *
 * Custom 100×100 viewBox with a slice of padding: the source art draws the
 * pylon body across the full 0–100 box with fractional coordinates, and the
 * original file bundled a "Noun Project" attribution below y=115 which we
 * drop by cropping the viewBox.
 */
export const GridIcon = svg(
  <>
    <path d="m96.875 95.312h-3.125c-0.86328 0-1.5625 0.69922-1.5625 1.5625s0.69922 1.5625 1.5625 1.5625h3.125c0.86328 0 1.5625-0.69922 1.5625-1.5625s-0.69922-1.5625-1.5625-1.5625z" />
    <path d="m85.938 95.312v-1.5625c0-2.5781-2.1094-4.6875-4.6875-4.6875h-62.5c-2.5781 0-4.6875 2.1094-4.6875 4.6875v1.5625h-10.938c-0.86328 0-1.5625 0.69922-1.5625 1.5625s0.69922 1.5625 1.5625 1.5625h84.375c0.86328 0 1.5625-0.69922 1.5625-1.5625s-0.69922-1.5625-1.5625-1.5625z" />
    <path d="m40.625 43.055v-6.6875l-18.969 2.7109c-0.77344 0.10938-1.3438 0.76953-1.3438 1.5469v6.25c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h3.125v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h9.8828z" />
    <path d="m40.625 20.906-28.43 5.6875c-0.73437 0.14453-1.2578 0.78516-1.2578 1.5312v6.25c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h3.125v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h3.125v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h14.062z" />
    <path d="m40.852 8.2109-19.195 2.7422c-0.77344 0.10938-1.3438 0.76953-1.3438 1.5469v6.25c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h3.125v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h10.938v-7.8125c0-0.40234 0.078125-0.79688 0.22656-1.1641z" />
    <path d="m59.375 36.367v6.6875l1.0547 2.2578h9.8828v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h3.125v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-6.25c0-0.77734-0.57031-1.4375-1.3438-1.5469z" />
    <path d="m59.375 20.906v11.906h10.938v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h3.125v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h3.125v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h1.5625c0.86328 0 1.5625-0.69922 1.5625-1.5625v-3.125c0-0.74609-0.52344-1.3867-1.2578-1.5312z" />
    <path d="m59.148 8.2109c0.14844 0.36719 0.22656 0.76172 0.22656 1.1641v7.8125h10.938v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-1.5625h3.125v1.5625c0 0.86328 0.69922 1.5625 1.5625 1.5625s1.5625-0.69922 1.5625-1.5625v-6.25c0-0.77734-0.57031-1.4375-1.3438-1.5469z" />
    <path d="m21.609 87.5h3.4492l3.5664-7.6406 14.934 3.7344-15.625 3.9062h12.883l9.1836-2.2969 9.1836 2.2969h12.883l-15.625-3.9062 14.934-3.7344 3.5664 7.6406h3.4492l-20.578-44.098v-34.027c0-0.41406-0.16406-0.8125-0.45703-1.1055l-6.25-6.25c-0.60938-0.60938-1.6016-0.60938-2.2109 0l-6.25 6.25c-0.29297 0.29297-0.45703 0.69141-0.45703 1.1055v34.027zm12.352-9.5273 16.039 4.0117 16.066-4.0195-15.969-4.9336zm-3.4219-2.2227 14.246-4.3594-10.672-3.2969zm24.875-4.3438 14.039 4.3359-3.5234-7.5547zm8.6406-5.9141-14.086-5.6523-13.965 5.5664 14.098 4.3555zm-9.8789-7.332 8.707 3.4922-2.7422-5.8711zm-17.023 3.4258 8.6094-3.4336-5.9023-2.3672zm4.207-8.5664 8.6094 3.4531 8.668-3.457-8.6367-4.3594zm1.8594-4.4414 3.3164-1.6719-2.0508-1.0352zm10.25-1.6719 3.3086 1.6719-1.2617-2.707zm-7.0859-3.5781 3.6172 1.8281 3.6172-1.8281-3.6172-3.6172zm5.8281-5.8281 2.4766 2.4766v-4.9531zm-6.8984 2.4766 2.4766-2.4766-2.4766-2.4766zm0.81641-8.5586 3.8711 3.8711 3.8711-3.8711-3.8711-2.9023zm6.4766-4.8555 2.082 1.5625v-3.125zm-7.293 1.5625 2.082-1.5625-2.082-1.5625zm1.043-6.25 3.6445 2.7344 3.6445-2.7344-3.6445-2.7344zm6.25-4.6875 2.082 1.5625v-3.125zm-7.293 1.5625 2.082-1.5625-2.082-1.5625zm9.375-7.0312v-1.6953l-4.6875-4.6875-4.6875 4.6875v1.6953l4.6875 3.5156z" />
  </>,
  "-5 -5 110 110",
);

/** `Icons.power_off_outlined` — the grid node during an outage. */
export const PowerOffIcon = svg(
  <path d="M3.4 2.1 2 3.5l4 4V13c0 2.6 1.9 4.7 4.4 5v4h3.2v-4c.6-.1 1.2-.3 1.7-.6l4.2 4.2 1.4-1.4L3.4 2.1zM8 9.5l5.6 5.6c-.5.3-1 .4-1.6.4-1.7 0-3-1.3-3-3V9.5zM16 13V7h-2V3h-2v4h-1.2l6.9 6.9c.2-.3.3-.6.3-.9z" />,
);

/** `Icons.arrow_outward` — the export node. */
export const ArrowOutwardIcon = svg(
  <path d="M6 6v2h8.59L5 17.59 6.41 19 16 9.41V18h2V6H6z" />,
);

/**
 * Lucide `sun`. Stroke-based (a circle with eight rays) — deliberately not
 * the filled Material `solar_power` panel because "sun" reads faster at
 * icon size than a stylised panel array. The base `svg()` helper here is
 * fill-based, so this one hand-rolls the SVG to use `stroke` on the passed
 * colour.
 */
export function SolarIcon({ size = 24, color = "currentColor", style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

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
