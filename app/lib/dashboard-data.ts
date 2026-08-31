import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import type { DashboardData } from "@/app/components/sections/energyflow-home";
import { getDashboardData as getDemoDashboardData } from "@/app/components/sections/energyflow-home";
import { fetchLiveTariff, fetchLiveDailyCost } from "./octopus-live";
import { fetchEnergyFlowSnapshot, type EnergyFlowFetchResult } from "./energy-flow";
import { getActiveProperty } from "./property-state";

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
 *   … tariff       — placeholder; wire from `/api/octopus/connection` + tariff catalog
 *   … cost         — placeholder; compute from Octopus consumption × tariff
 *   … stats        — placeholder; from SunSync `sunsynk_daily_energy` + Octopus
 *   … history      — placeholder; aggregate SunSync 5-min readings to 10-min buckets
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
    history: boolean;
  };
  /**
   * Active property id the flow fetch was pinned to (via `X-Property-Id`).
   * Passed to the client wrapper so its polling stays on the SAME home
   * across refreshes — matches how the mobile app pins every eb-auth call
   * to the active property.
   */
  activePropertyId: string | null;
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
    const cookie = await cookieHeader();
    if (cookie === null) {
      return {
        data: demo,
        liveFields: {
          flow: { live: false, result: null },
          tariff: false,
          cost: false,
          stats: false,
          history: false,
        },
        activePropertyId: null,
      };
    }

    // Resolve the active property FIRST — the flow fetch needs to be pinned
    // to the same home the mobile app is showing (via `X-Property-Id`),
    // otherwise the backend's fallback chain can silently resolve a
    // different property when the user has more than one.
    const activeProperty = await getActiveProperty();
    const propertyId = activeProperty?.id;

    // All three live fetches run in parallel — none depends on the others,
    // so the wall clock for a fully-live dashboard is `max(flow, tariff+
    // cost)` rather than the sum. `fetchLiveTariff` returns the tariff
    // result up-front so we can chain it into the cost computation
    // without a second round-trip.
    const [flowResult, tariffResult] = await Promise.all([
      fetchEnergyFlowSnapshot(cookie, { propertyId }),
      fetchLiveTariff(),
    ]);
    const cost = await fetchLiveDailyCost(tariffResult.tariff);
    const flowSnapshot = flowResult.status === "ok" ? flowResult.snapshot : null;

    const merged: DashboardData = {
      ...demo,
      ...(flowSnapshot ? { flow: flowSnapshot } : {}),
      ...(tariffResult.tariff ? { tariff: tariffResult.tariff } : {}),
      ...(cost ? { cost } : {}),
    };

    return {
      data: merged,
      liveFields: {
        flow: { live: flowSnapshot !== null, result: flowResult },
        tariff: tariffResult.tariff !== null,
        cost: cost !== null,
        // Still on demo until their endpoint mappings land. When we wire
        // stats + history, flip these booleans and the banner on the page
        // will shrink to only mention the ones still pending.
        stats: false,
        history: false,
      },
      activePropertyId: propertyId ?? null,
    };
  },
);
