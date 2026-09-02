import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import type { DashboardData, PowerHistory } from "@/app/components/sections/energyflow-home";
import { getDashboardData as getDemoDashboardData } from "@/app/components/sections/energyflow-home";
import { fetchLiveTariff, fetchLiveDailyCost } from "./octopus-live";
import { fetchEnergyFlowSnapshot, type EnergyFlowFetchResult } from "./energy-flow";
import { fetchPowerHistory, type PowerHistoryFetchResult } from "./sunsync-history";
import { buildLiveStats, findPeakSolar } from "./live-stats";
import { integratePoints, mergeMix } from "./history-integration";
import { getActiveProperty } from "./property-state";
import { ukDateParam, ukDayStartUtc } from "./uk-time";

/**
 * Server-side dashboard data assembly.
 *
 * The demo snapshot (`getDemoDashboardData()`) still provides the shape and
 * the fallback values for the fields we haven't wired live yet — tariff,
 * daily cost, stats strip, 24-hour history. Live values overwrite the demo
 * ones as they land. This lets the connected user see real numbers where
 * we have them without hiding whole cards while the mapping matures.
 *
 * Field wiring status (as of this file):
 *   ✓ flow         — live from `/api/energy-profile/energy-flow` (aggregated;
 *                    the same endpoint the mobile card reads, so the two
 *                    surfaces render matching numbers — see energy-flow.ts).
 *   ✓ history      — live from `/api/sunsynk/telemetry`, bucketed to 5-min
 *                    UK-wall-clock slots (same rule as mobile — see
 *                    sunsync-history.ts). Client-side date navigation goes
 *                    through app/api/dashboard/history for other days.
 *   ✓ stats        — live from `todayMix` on the same energy-flow response
 *                    the diagram reads; peak solar computed from the history
 *                    points above. Nullable totals surface as em-dashes —
 *                    NEVER coalesced to 0 (see live-stats.ts doc block).
 *   … tariff       — placeholder; wire from `/api/octopus/connection` + tariff catalog
 *   … cost         — placeholder; compute from Octopus consumption × tariff
 */

// ── Cookie helper ────────────────────────────────────────────────────────

async function cookieHeader(): Promise<string | null> {
  const store = await cookies();
  const header = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return header.length > 0 ? header : null;
}

// ── Assembly ─────────────────────────────────────────────────────────────

/**
 * Returned by {@link getLiveDashboardData} so the caller can flag which
 * cards are still on demo values and render an honest banner.
 *
 * `flow.result` carries the raw fetch outcome so the page can render an
 * accurate empty state per failure mode (no-property vs no-data vs
 * http-error vs network-error). This exists because the previous silent
 * demo-fallback masked why the numbers on web diverged from mobile: the
 * web was quietly showing the demo snapshot while the mobile was pulling
 * a real reading, and both surfaces LOOKED like they were live.
 */
export interface DashboardDataResult {
  data: DashboardData;
  liveFields: {
    /**
     * True only when the flow snapshot came from the backend. The raw
     * `result` is exposed so the page can distinguish "not signed in",
     * "no property", "connected but no reading yet", and "backend down".
     */
    flow: { live: boolean; result: EnergyFlowFetchResult | null };
    tariff: boolean;
    cost: boolean;
    stats: boolean;
    /**
     * True when the initial (today) history came from the backend. Same
     * shape as `flow` — the raw result carries the specific reason so the
     * chart can render an accurate empty state on failure.
     */
    history: { live: boolean; result: PowerHistoryFetchResult | null };
  };
  /**
   * Active property id the flow fetch was pinned to (via `X-Property-Id`).
   * Passed to the client wrapper so its polling stays on the SAME home
   * across refreshes — matches how the mobile app pins every eb-auth call
   * to the active property.
   */
  activePropertyId: string | null;
  /** Today's UK date (`YYYY-MM-DD`) — the initial day the chart is showing. */
  todayIso: string;
}

/**
 * Assemble the dashboard data for a signed-in user. Live values overwrite
 * demo ones per field. When we can't reach the backend at all the caller
 * still gets a fully-shaped `DashboardData` with everything on demo — the
 * page never breaks because a service is momentarily down.
 */
export const getLiveDashboardData = cache(
  async (): Promise<DashboardDataResult> => {
    const demo = getDemoDashboardData();
    const now = new Date();
    const todayIso = ukDateParam(now);
    const cookie = await cookieHeader();
    if (cookie === null) {
      return {
        data: demo,
        liveFields: {
          flow: { live: false, result: null },
          tariff: false,
          cost: false,
          stats: false,
          history: { live: false, result: null },
        },
        activePropertyId: null,
        todayIso,
      };
    }

    // Resolve the active property FIRST — the flow fetch needs to be pinned
    // to the same home the mobile app is showing (via `X-Property-Id`),
    // otherwise the backend's fallback chain can silently resolve a
    // different property when the user has more than one.
    const activeProperty = await getActiveProperty();
    const propertyId = activeProperty?.id;

    // Live fetches run in parallel — none depends on the others, so the
    // wall clock for a fully-live dashboard is `max(flow, history, tariff+
    // cost)` rather than the sum. `fetchLiveTariff` returns the tariff
    // result up-front so we can chain it into the cost computation without
    // a second round-trip.
    const [flowResult, historyResult, tariffResult] = await Promise.all([
      fetchEnergyFlowSnapshot(cookie, { propertyId }),
      fetchPowerHistory(cookie, { propertyId, dayStartUtc: ukDayStartUtc(now) }),
      fetchLiveTariff(),
    ]);
    const cost = await fetchLiveDailyCost(tariffResult.tariff);
    const flowSnapshot = flowResult.status === "ok" ? flowResult.snapshot : null;
    const todayMix = flowResult.status === "ok" ? flowResult.todayMix : null;
    const liveHistory = historyResult.status === "ok"
      ? historyPointsToDashboard(historyResult.points, todayIso, now)
      : null;
    // Fill any null fields in the backend's `todayMix` by integrating the
    // history we already fetched — reconciliation sometimes returns nulls
    // even though the raw readings are all there, and em-dashes across the
    // strip beside a full flow diagram just reads as "broken". A merged
    // mix keeps whatever backend numbers ARE present (more precise: the
    // backend applies data-quality guards) and only falls back per-null.
    const integratedMix = liveHistory ? integratePoints(liveHistory.points) : null;
    const effectiveMix = mergeMix(todayMix, integratedMix);
    const liveStats = effectiveMix
      ? buildLiveStats(effectiveMix, findPeakSolar(liveHistory?.points ?? []))
      : null;

    const merged: DashboardData = {
      ...demo,
      ...(flowSnapshot ? { flow: flowSnapshot } : {}),
      ...(liveHistory ? { history: liveHistory, dayIso: todayIso, dayLabel: liveHistory.dayLabel ?? demo.dayLabel } : {}),
      ...(liveStats ? { stats: liveStats } : {}),
      ...(tariffResult.tariff ? { tariff: tariffResult.tariff } : {}),
      ...(cost ? { cost } : {}),
    };

    return {
      data: merged,
      liveFields: {
        flow: { live: flowSnapshot !== null, result: flowResult },
        tariff: tariffResult.tariff !== null,
        cost: cost !== null,
        stats: liveStats !== null,
        history: { live: liveHistory !== null, result: historyResult },
      },
      activePropertyId: propertyId ?? null,
      todayIso,
    };
  },
);

/**
 * Wrap a bucketed telemetry series in the {@link PowerHistory} shape the
 * chart consumes. `dayLabel` becomes the header chip; kept as an optional
 * field on the return so the caller only replaces it when we successfully
 * built a live series (a failed fetch leaves the demo label alone).
 */
function historyPointsToDashboard(
  points: PowerHistory["points"],
  isoDay: string,
  now: Date,
): PowerHistory & { dayLabel?: string } {
  const isToday = isoDay === ukDateParam(now);
  return {
    points,
    windowLabel: isToday ? "Today" : "24h View",
    dayLabel: isToday ? "Today" : isoDay,
  };
}
