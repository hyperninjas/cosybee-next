/**
 * Site-wide chart theme for Recharts. Every chart in the app imports its
 * colors and default configuration from here so all data-viz shares one
 * palette and re-themes automatically with the site (light/dark, brand
 * refresh, per-page palette overrides).
 *
 * Colors resolve at render time via CSS variables — nothing is hex-coded.
 * That means:
 *   1. Light/dark flips need no chart re-render logic.
 *   2. A future re-theme (globals.css edit) sweeps every chart at once.
 *   3. Charts placed inside `.efh-scope` pick up the energy-channel palette
 *      (`--efh-solar`, `--efh-battery`, `--efh-grid`, `--efh-home`); charts
 *      elsewhere get sensible semantic defaults.
 *
 * Import individual helpers as needed:
 *
 *   import { chartColors, gridProps, axisProps, tooltipProps,
 *            channelGradient } from "@/app/lib/chart-theme";
 *
 * The exported prop bags are plain objects — spread them onto the matching
 * Recharts elements to inherit the site's defaults. Override any single
 * field by passing it after the spread.
 */

import type { CSSProperties } from "react";

/** Semantic + channel color tokens, resolved via CSS variables. */
export const chartColors = {
  // Semantic (defined by HeroUI + globals.css :root / .dark blocks).
  foreground: "var(--foreground)",
  muted: "var(--muted)",
  border: "var(--border)",
  separator: "var(--separator)",
  surface: "var(--surface)",
  surfaceSecondary: "var(--surface-secondary)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",

  // Energy channels (defined by `.efh-scope` in globals.css). Charts placed
  // outside that scope fall back to the semantic tokens above rather than
  // rendering with a broken `var()` reference, because these lookups happen
  // in components that decide their own palette.
  solar: "var(--efh-solar, var(--warning))",
  battery: "var(--efh-battery, var(--success))",
  grid: "var(--efh-grid, var(--accent))",
  home: "var(--efh-home, var(--danger))",
} as const;

export type ChartColorKey = keyof typeof chartColors;

/**
 * Default `<CartesianGrid>` props — horizontal dashed lines only, tied to
 * the site's separator token. Spread onto the element:
 *
 *   <CartesianGrid {...gridProps} />
 */
export const gridProps = {
  vertical: false,
  stroke: chartColors.separator,
  strokeDasharray: "4 4",
} as const;

/**
 * Default axis (`<XAxis>` / `<YAxis>`) props. Muted ticks, no axis line, no
 * tick marks — matches the reference's "clean chrome, colored data" look.
 */
export const axisProps = {
  tick: { fill: chartColors.muted, fontSize: 11 } satisfies CSSProperties,
  tickLine: false,
  axisLine: false,
} as const;

/**
 * Default `<Tooltip>` styling. Card-like surface with a themed border, so
 * a hover tooltip reads as a floating token-panel rather than a plain
 * browser popup. Fonts and radii match HeroUI Card conventions.
 */
export const tooltipProps = {
  cursor: { stroke: chartColors.muted, strokeDasharray: "3 3" },
  contentStyle: {
    backgroundColor: chartColors.surface,
    border: `1px solid ${chartColors.border}`,
    borderRadius: 8,
    boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.35)",
    color: chartColors.foreground,
    fontSize: 12,
    padding: "8px 12px",
  } satisfies CSSProperties,
  labelStyle: { color: chartColors.muted, marginBottom: 4 } satisfies CSSProperties,
  itemStyle: { color: chartColors.foreground } satisfies CSSProperties,
} as const;

/**
 * Build a `<linearGradient>` config for area-chart fills. Returns the
 * gradient's element props alongside the URL string Recharts expects as
 * the `fill` on the `<Area>`. Call once per series and destructure:
 *
 *   const solarGrad = channelGradient("solar", chartColors.solar);
 *   ...
 *   <defs>{solarGrad.element}</defs>
 *   <Area fill={solarGrad.fill} stroke={chartColors.solar} ... />
 *
 * Stop opacities default to the reference's soft-fade look (40% → 0%);
 * pass `{ top, bottom }` to tune per chart.
 */
export function channelGradient(
  id: string,
  color: string,
  { top = 0.4, bottom = 0 }: { top?: number; bottom?: number } = {},
) {
  const gradId = `chart-grad-${id}`;
  return {
    id: gradId,
    fill: `url(#${gradId})`,
    color,
    top,
    bottom,
  };
}

/**
 * Format an instantaneous power reading given in kilowatts. Auto-scales:
 * anything under a full kW switches to watts, so a tooltip line like
 * `Solar 0 W` matches the reference when the sun's down and reads
 * `Solar 6.42 kW` at midday. The kW form shows two decimals; W is rounded
 * to a whole number because sub-watt precision is meaningless at that
 * scale.
 */
export function formatPower(kW: number): string {
  if (!Number.isFinite(kW)) return "—";
  const abs = Math.abs(kW);
  if (abs < 1) return `${Math.round(kW * 1000)} W`;
  return `${kW.toFixed(2)} kW`;
}
