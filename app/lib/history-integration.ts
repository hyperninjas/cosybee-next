/**
 * Integrate bucketed power readings (`PowerHistoryPoint[]`) into cumulative
 * kWh totals shaped like `todayMix`. Used two ways:
 *
 *   1. **Fallback for null `todayMix` fields.** The backend sometimes
 *      answers `todayMix: { solarGeneratedKwh: null, … }` — reconciliation
 *      hasn't finished, or a data-quality guard rejected the day. Rather
 *      than showing em-dashes across the tile strip we already have the
 *      raw shape; the mobile app does the same thing (`reconcileDay` sums
 *      the frames it kept).
 *   2. **Source of truth for past days.** The backend's `todayMix` is
 *      fixed to today (see `energy-profile.service.ts:76`). For the
 *      date-navigator's older days, integration IS the number the strip
 *      shows.
 *
 * ### Precision
 *
 * `dt` is the bucket width from `sunsync-history.ts` (5 minutes). Each
 * point is treated as the AVERAGE kW during its bucket, so kWh = kW × (5/60).
 * A partial-day (freshly linked inverter, fewer than 288 buckets) integrates
 * only what it has — the totals stay honest to "so far".
 *
 * ### Sign handling
 *
 * `grid` and `battery` are signed. Split accordingly:
 *   • `grid > 0` → importing → adds to `importedFromGridKwh`
 *   • `grid < 0` → exporting → adds to `exportedToGridKwh`
 *   • `battery > 0` → discharging → adds to `batteryDischargedKwh`
 *   • `battery < 0` → charging   → adds to `batteryStoredKwh`
 * Matches the sign convention documented in `sunsync-history.ts`.
 */

import type { PowerHistoryPoint } from "@/app/components/sections/energyflow-home";
import type { TodayEnergyMix } from "./energy-flow";

/** Bucket width in hours. Must match `BUCKET_MINUTES` in sunsync-history.ts. */
const DT_HOURS = 5 / 60;

/**
 * Reduce points to cumulative totals. Empty input → all fields zero rather
 * than null, because an "empty series" is a real answer ("nothing was
 * measured today"), not a refusal.
 */
export function integratePoints(
  points: ReadonlyArray<PowerHistoryPoint>,
): TodayEnergyMix {
  let solar = 0;
  let home = 0;
  let gridIn = 0;
  let gridOut = 0;
  let batIn = 0;
  let batOut = 0;
  for (const p of points) {
    if (p.solar > 0) solar += p.solar * DT_HOURS;
    if (p.home > 0) home += p.home * DT_HOURS;
    if (p.grid > 0) gridIn += p.grid * DT_HOURS;
    else if (p.grid < 0) gridOut += -p.grid * DT_HOURS;
    if (p.battery > 0) batOut += p.battery * DT_HOURS;
    else if (p.battery < 0) batIn += -p.battery * DT_HOURS;
  }
  return {
    solarGeneratedKwh: solar,
    houseConsumedKwh: home,
    importedFromGridKwh: gridIn,
    exportedToGridKwh: gridOut,
    batteryStoredKwh: batIn,
    batteryDischargedKwh: batOut,
  };
}

/**
 * Overlay the backend's `todayMix` on top of the integrated totals — the
 * backend wins per-field where it has an answer, and the integration fills
 * the null gaps. If both are null on a field the result is null too (there
 * is no honest number to show).
 */
export function mergeMix(
  backend: TodayEnergyMix | null,
  integrated: TodayEnergyMix | null,
): TodayEnergyMix | null {
  if (backend === null && integrated === null) return null;
  return {
    solarGeneratedKwh:
      backend?.solarGeneratedKwh ?? integrated?.solarGeneratedKwh ?? null,
    houseConsumedKwh:
      backend?.houseConsumedKwh ?? integrated?.houseConsumedKwh ?? null,
    batteryStoredKwh:
      backend?.batteryStoredKwh ?? integrated?.batteryStoredKwh ?? null,
    batteryDischargedKwh:
      backend?.batteryDischargedKwh ?? integrated?.batteryDischargedKwh ?? null,
    exportedToGridKwh:
      backend?.exportedToGridKwh ?? integrated?.exportedToGridKwh ?? null,
    importedFromGridKwh:
      backend?.importedFromGridKwh ?? integrated?.importedFromGridKwh ?? null,
  };
}
