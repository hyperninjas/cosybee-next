/**
 * Build the dashboard's "stat strip" from the live `todayMix` totals on
 * `/api/energy-profile/energy-flow` + the peak solar reading from the
 * history we already fetch for the chart. Both inputs land in the same
 * pass through `getLiveDashboardData`, so this helper is pure — no I/O.
 *
 * ### Handling nulls
 *
 * `todayMix` fields are nullable, and a `null` is a REFUSAL to answer, not
 * a zero (see `energy-profile.response-schemas.ts:582`). Rendering `0.0
 * kWh` where the backend meant "unavailable" is what showed "100% off-grid"
 * beside a chart that had 10 kW of grid import. So an unavailable value
 * renders as an em-dash and drops any sub-line that would have depended on
 * a number we don't have.
 */

import type {
  PowerHistoryPoint,
  StatTile,
} from "@/app/components/sections/energyflow-home";
import type { TodayEnergyMix } from "./energy-flow";

/**
 * Peak solar generation observed on the currently-visible day, in kW and
 * the UK wall-clock label ("HH:MM") of the sample where it happened.
 * Returned as an object rather than a tuple so a null-peak day (no sun,
 * no readings) is discriminable from "0 kW peak at 00:00".
 */
export interface PeakSolar {
  kw: number;
  time: string;
}

/**
 * Scan the bucketed history for peak solar. Returns null when the series
 * is empty OR when every reading is exactly zero (a genuine "no sun" day
 * — labelling it "Peak 0 kW at 00:00" would be worse than saying nothing).
 */
export function findPeakSolar(
  points: ReadonlyArray<PowerHistoryPoint>,
): PeakSolar | null {
  if (points.length === 0) return null;
  let best: PowerHistoryPoint | null = null;
  for (const p of points) {
    if (best === null || p.solar > best.solar) best = p;
  }
  if (best === null || best.solar <= 0) return null;
  return { kw: best.solar, time: best.time };
}

/**
 * Turn the six cumulative totals (plus optional peak solar) into the
 * `StatTile[]` the `StatStrip` renders. The tile ORDER must match the
 * demo strip (solar / grid-import / battery / home / grid-export) because
 * the layout is column-major on wide screens — reshuffling would move the
 * house tile off the "middle" that the reference eyeballs against.
 */
export function buildLiveStats(
  mix: TodayEnergyMix,
  peakSolar: PeakSolar | null,
): StatTile[] {
  return [
    {
      key: "solar",
      label: "Solar Gen",
      value: fmtKwh(mix.solarGeneratedKwh),
      unit: "kWh",
      // Only include the sub-line if we actually observed a peak — a solar
      // total of "12.3 kWh" without a peak sub-line reads fine; the same
      // tile with "Peak 0 kW at —" reads broken.
      ...(peakSolar ? { sub: `Peak ${peakSolar.kw.toFixed(1)} kW at ${peakSolar.time}` } : {}),
      tone: "solar",
    },
    {
      key: "grid-import",
      label: "Grid Import",
      value: fmtKwh(mix.importedFromGridKwh),
      unit: "kWh",
      // Deliberately no sub-line: peak / off-peak split would need
      // tariff-aware bucketing that isn't wired yet. Adding a placeholder
      // ("From the grid") is noise — the header already says "Grid Import".
      tone: "grid-import",
    },
    {
      key: "battery",
      label: "Battery",
      value: fmtPairKwh(mix.batteryStoredKwh, mix.batteryDischargedKwh),
      unit: "kWh",
      sub: "Charged / Discharged",
      tone: "battery",
    },
    {
      key: "home",
      label: "Home Usage",
      value: fmtKwh(mix.houseConsumedKwh),
      unit: "kWh",
      // "vs 15.8 kWh avg" would need a rolling historical mean — not yet
      // computed. Skip until the stats-history endpoint lands.
      tone: "home",
    },
    {
      key: "grid-export",
      label: "Grid Export",
      value: fmtKwh(mix.exportedToGridKwh),
      unit: "kWh",
      // "Export earnings" needs the outbound tariff; will hang off the
      // same octopus-cost pipeline as the DailyCostCard. Deferred here.
      tone: "grid-export",
    },
  ];
}

// ── Formatting ───────────────────────────────────────────────────────────

/** "12.3" for a number, "—" for null. Rendered as the tile's headline value. */
function fmtKwh(v: number | null): string {
  if (v === null) return "—";
  return v.toFixed(1);
}

/** "7.8 / 5.4" — either side becomes "—" independently. */
function fmtPairKwh(a: number | null, b: number | null): string {
  const l = a === null ? "—" : a.toFixed(1);
  const r = b === null ? "—" : b.toFixed(1);
  return `${l} / ${r}`;
}
