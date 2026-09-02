"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Chip } from "@heroui/react";
import {
  axisProps,
  channelGradient,
  chartColors,
  formatPower,
  gridProps,
} from "@/app/lib/chart-theme";
import type { PowerHistory } from "./types";

/**
 * 24h multi-series power chart, matching the reference:
 *   • Home  — rose (`--efh-home`)  — instantaneous house load
 *   • Solar — amber (`--efh-solar`) — generation
 *   • Grid  — sky   (`--efh-grid`)  — import (positive) / export (negative)
 *   • Battery — green (`--efh-battery`) — discharge (positive) / charge (negative)
 *
 * Uses recharts' AreaChart because the reference chart shows a translucent
 * fill under every line — a plain LineChart would render just the strokes
 * and lose the "magnitude at a glance" story. All chrome (grid, axis,
 * tooltip cursor) comes from the shared {@link chartColors} palette so
 * this chart re-themes with the site. Legend chips toggle their series.
 */

type ChannelKey = "home" | "solar" | "grid" | "battery";

interface ChannelDef {
  key: ChannelKey;
  label: string;
  color: string;
}

const CHANNELS: ChannelDef[] = [
  { key: "home", label: "Home", color: chartColors.home },
  { key: "solar", label: "Solar", color: chartColors.solar },
  { key: "grid", label: "Grid", color: chartColors.grid },
  { key: "battery", label: "Battery", color: chartColors.battery },
];

/**
 * Themed tooltip payload shape. Recharts' `Tooltip content` renders with a
 * runtime-typed payload; we narrow it to the fields we actually consume
 * (rather than pulling in the library's deep-generic `TooltipProps`, which
 * changed shape between recharts 2.x and 3.x).
 */
interface TooltipEntry {
  dataKey: string;
  name: string;
  value: number | string;
  color: string;
}
interface PowerTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}

/**
 * Themed tooltip. Renders a card-styled floating panel with the time at
 * the top and one row per active channel: color dot, name, right-aligned
 * value in mixed units (auto kW/W via {@link formatPower}). Uses HeroUI
 * tokens throughout so light/dark modes flip cleanly.
 */
function PowerTooltip({ active, payload, label }: PowerTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[168px] rounded-lg border border-border bg-surface p-3 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]">
      <div className="mb-2 text-xs font-semibold text-foreground">{label}</div>
      <div className="space-y-1.5 text-xs">
        {payload.map((entry) => {
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value);
          return (
            <div key={entry.dataKey} className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-muted">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="ml-auto font-semibold text-foreground tabular-nums">
                {formatPower(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PowerHistoryChart({ history }: { history: PowerHistory }) {
  // Legend toggles. `disabled` is intentionally a Set so future channel
  // additions don't require a reducer — one identity, arbitrary count.
  const [disabled, setDisabled] = useState<Set<ChannelKey>>(new Set());

  const toggle = (key: ChannelKey) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const gradients = CHANNELS.map((c) => ({
    def: c,
    grad: channelGradient(c.key, c.color),
  }));

  // ~144 data points at 10-min resolution → an X-axis label every 36
  // samples gives us the reference's 6-hour tick spacing (00, 06, 12, 18).
  const xTickInterval = Math.max(1, Math.floor(history.points.length / 4) - 1);

  // Data-fit Y-axis. Recharts' auto-domain always snaps to round numbers
  // computed from the FULL data range including toggled-off channels, so
  // toggling one channel off didn't rescale to fit the remaining. Compute
  // ourselves: scan only the visible channels, pick a "nice" step, and
  // round the domain outward one step so the chart never clips a peak.
  // Mirrors the mobile chart (see the reference screenshot: 0.6 / 0.3 / 0
  // / −0.3 for a house drawing ~500 W and battery moving ~300 W).
  const yAxis = useMemo(
    () => niceYAxis(history.points, disabled),
    [history.points, disabled],
  );

  return (
    <Card variant="default">
      <Card.Header className="flex-row items-start justify-between gap-2">
        <div>
          <Card.Title>Power History Chart</Card.Title>
          <Card.Description>Power readings across the day</Card.Description>
        </div>
        <Chip variant="soft" color="default" size="sm">
          {history.windowLabel}
        </Chip>
      </Card.Header>

      <Card.Content className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history.points}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                {gradients.map(({ def, grad }) => (
                  <linearGradient
                    key={grad.id}
                    id={grad.id}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={def.color} stopOpacity={grad.top} />
                    <stop
                      offset="100%"
                      stopColor={def.color}
                      stopOpacity={grad.bottom}
                    />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid {...gridProps} />
              <XAxis
                dataKey="time"
                {...axisProps}
                interval={xTickInterval}
              />
              <YAxis
                {...axisProps}
                width={44}
                domain={[yAxis.min, yAxis.max]}
                ticks={yAxis.ticks}
                tickFormatter={yAxis.format}
              />
              {/* Emphasize the 0 kW baseline — a signed chart (grid /
                  battery flip below zero) is unreadable without one.
                  Matches the mobile reference. */}
              <ReferenceLine
                y={0}
                stroke={chartColors.muted}
                strokeOpacity={0.6}
              />
              <Tooltip
                content={<PowerTooltip />}
                cursor={{ stroke: chartColors.muted, strokeDasharray: "3 3" }}
              />

              {gradients.map(({ def, grad }) =>
                disabled.has(def.key) ? null : (
                  <Area
                    key={def.key}
                    // `linear` = straight segments between raw samples.
                    // The reference "Power History Chart" is a jagged
                    // mountain silhouette showing every 5-min spike — a
                    // curve smoother (monotone, natural, basis) rounds
                    // those spikes off and hides real short-lived events
                    // like cloud passes and stove pulses. Keep it raw.
                    type="linear"
                    dataKey={def.key}
                    name={def.label}
                    stroke={def.color}
                    strokeWidth={1.5}
                    fill={grad.fill}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0, fill: def.color }}
                    isAnimationActive={false}
                  />
                ),
              )}

              <Legend content={() => null} height={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Custom legend built from HeroUI Chip — click to toggle a series. */}
        <div className="mt-4 flex flex-wrap gap-2">
          {CHANNELS.map((c) => {
            const isOff = disabled.has(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggle(c.key)}
                aria-pressed={!isOff}
                className="cursor-pointer"
              >
                <Chip
                  variant="soft"
                  color="default"
                  size="sm"
                  className={isOff ? "opacity-40" : ""}
                >
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: c.color }}
                    className="mr-1.5 inline-block size-2 rounded-full align-middle"
                  />
                  {c.label}
                </Chip>
              </button>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
}

// ── Y-axis auto-fit ──────────────────────────────────────────────────────

interface AxisSpec {
  min: number;
  max: number;
  ticks: number[];
  format: (v: number) => string;
}

/**
 * Compute a nicely-rounded Y-axis for the visible channels.
 *
 * Behaviour:
 *   1. Scan every visible sample for min/max across `home`, `solar`, `grid`,
 *      `battery`. `grid` and `battery` are signed, so a big export or a
 *      hard charge shows up on the negative side; `home` and `solar` clamp
 *      to zero on the positive side.
 *   2. Pick a "nice" step from a fixed ladder (0.1, 0.2, 0.5, 1, 2, 5, 10,
 *      20 kW). Target ~4 ticks between the two extremes — same density as
 *      the mobile reference (0.6 / 0.3 / 0 / −0.3).
 *   3. Round the min DOWN and max UP to the next step so peaks never
 *      touch the frame. If the range is entirely non-negative the min
 *      snaps to 0 (a house that only draws never needs a −0.1 kW tick).
 *   4. Auto-scale units — under 1 kW the axis reads in watts (`120 W`),
 *      otherwise kW. Matches the mobile "W under 1 kW, kW above" rule
 *      documented in `energy_flow_card.dart`.
 *
 * All-zero data (freshly linked inverter, or user toggled every channel
 * off) collapses to a symmetric ±0.5 kW frame so the 0-line still renders
 * and the chart doesn't shrink to a single row of pixels.
 */
function niceYAxis(
  points: ReadonlyArray<{
    home: number;
    solar: number;
    grid: number;
    battery: number;
  }>,
  disabled: ReadonlySet<ChannelKey>,
): AxisSpec {
  let min = 0;
  let max = 0;
  for (const p of points) {
    if (!disabled.has("home") && p.home > max) max = p.home;
    if (!disabled.has("solar") && p.solar > max) max = p.solar;
    if (!disabled.has("grid")) {
      if (p.grid > max) max = p.grid;
      if (p.grid < min) min = p.grid;
    }
    if (!disabled.has("battery")) {
      if (p.battery > max) max = p.battery;
      if (p.battery < min) min = p.battery;
    }
  }

  // Empty / all-zero — give the 0-line something to sit against.
  if (min === 0 && max === 0) {
    return {
      min: -0.5,
      max: 0.5,
      ticks: [-0.5, 0, 0.5],
      format: (v) => `${v}kW`,
    };
  }

  // Pick a step that lands roughly 5–6 ticks across the range. Target 5 —
  // an earlier target of 4 rounded a 5.93 kW peak up to 10 kW with 4 kW of
  // empty headroom, which is what the "why does it go to 10 when max is 5?"
  // screenshot flagged.
  const range = max - min;
  const step = pickStep(range / 5);

  // Snap outward so peaks are inside the frame, not on it.
  const snappedMin = Math.floor(min / step) * step;
  const snappedMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  // Guard: FP arithmetic can drift and produce ticks like 0.6000000000001.
  // `roundTo` collapses those back to the step precision.
  const digits = decimalsForStep(step);
  for (let t = snappedMin; t <= snappedMax + step / 2; t += step) {
    ticks.push(roundTo(t, digits));
  }

  // Under 1 kW absolute range → label in watts. Same rule mobile uses.
  const absMax = Math.max(Math.abs(snappedMin), Math.abs(snappedMax));
  const inWatts = absMax < 1;
  const format = inWatts
    ? (v: number) => `${Math.round(v * 1000)}W`
    : (v: number) => `${roundTo(v, digits)}kW`;

  return { min: snappedMin, max: snappedMax, ticks, format };
}

/**
 * "Nice" step ladder in kW. Returned step ≥ the requested minimum, so the
 * chart never packs more than ~5 ticks into the visible range.
 */
function pickStep(minStep: number): number {
  const ladder = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  for (const step of ladder) {
    if (step >= minStep) return step;
  }
  // Beyond 100 kW — a genuinely huge system. Round the requested step up
  // to a power of ten so labels stay clean.
  const magnitude = 10 ** Math.ceil(Math.log10(minStep));
  return magnitude;
}

/** How many decimals a step needs for a clean label (0.1 → 1, 1 → 0). */
function decimalsForStep(step: number): number {
  if (step >= 1) return 0;
  if (step >= 0.1) return 1;
  return 2;
}

function roundTo(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
