"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
                tickFormatter={(v: number) => `${v}kW`}
              />
              <Tooltip
                content={<PowerTooltip />}
                cursor={{ stroke: chartColors.muted, strokeDasharray: "3 3" }}
              />

              {gradients.map(({ def, grad }) =>
                disabled.has(def.key) ? null : (
                  <Area
                    key={def.key}
                    type="monotone"
                    dataKey={def.key}
                    name={def.label}
                    stroke={def.color}
                    strokeWidth={1.75}
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
