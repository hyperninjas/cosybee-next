/**
 * Fetch + map the aggregated `/api/energy-profile/energy-flow` response into
 * the dashboard's `EnergyFlowSnapshot` shape.
 *
 * Ported from the mobile client (`energiebeemobile/lib/features/phase1/data/solar/energy_flow.dart`
 * and `.../widgets/solar/energy_flow_card.dart`) so both surfaces render the
 * SAME numbers from the SAME source of truth. History: the web previously
 * called `/api/sunsynk/energy-flow` (raw inverter reading), while the mobile
 * hit `/api/energy-profile/energy-flow` (an aggregated endpoint that measures
 * the house directly and reports inverter overhead). Aligning on the mobile's
 * endpoint eliminates the derivation drift that had the two surfaces showing
 * different values at the same instant.
 *
 * The backend reports kW throughout; the dashboard renders in W to match
 * mobile (`260 W` below 1 kW, auto-scales to `1.3 kW` above), so we multiply
 * once here at the boundary and leave everything downstream in watts.
 */

import type { EnergyFlowSnapshot, FlowDirection } from "@/app/components/sections/energyflow-home";

/**
 * Freshness classification. Mirrors the mobile's `DataFreshness` enum and
 * thresholds (`data_provenance.dart` — `kFreshFor = 11 min`, `kLiveMaxAge =
 * 20 min`) so both surfaces agree on when a sample stops being "live".
 */
export type Freshness = "fresh" | "stale" | "offline" | "awaitingFirstData";

/** Fresh below this age. Matches mobile's `kFreshFor`. */
export const FRESH_FOR_MS = 11 * 60_000;
/** Offline at or above this age. Matches the server's `REALTIME_MAX_AGE_MS`. */
export const LIVE_MAX_AGE_MS = 20 * 60_000;

/** Sensor-noise floor. Below this the direction is "idle", not "in/out". */
const NOISE_FLOOR_W = 10;

// ── Backend response (subset we consume) ─────────────────────────────────

/**
 * The `realTime` block of `/api/energy-profile/energy-flow`. Only the fields
 * the dashboard cares about are typed. `system`, `dataQuality` and `carbon`
 * are deliberately ignored — those belong to other cards.
 */
interface RealTimeFlowResponse {
  solarKw?: number;
  houseKw?: number;
  gridKw?: number;
  batteryKw?: number;
  batteryPercent?: number;
  /** Positive kW consumed by the inverter itself (standby + conversion loss). */
  systemOverheadKw?: number;
  /** ISO 8601. May be absent when the inverter hasn't reported yet. */
  measuredAt?: string | null;
}

/**
 * Cumulative totals from local-midnight to `timestamp`. Every field is
 * nullable — a `null` here means "the backend refuses to answer", NOT zero.
 * See `energy-profile.response-schemas.ts:582`: coalescing null → 0 is what
 * historically rendered "100% off-grid" beside a chart showing 10 kW of
 * import. Callers must treat null as "unavailable" and either skip the
 * tile or show a placeholder — never fabricate a 0.
 */
export interface TodayEnergyMix {
  solarGeneratedKwh: number | null;
  houseConsumedKwh: number | null;
  batteryStoredKwh: number | null;
  batteryDischargedKwh: number | null;
  exportedToGridKwh: number | null;
  importedFromGridKwh: number | null;
}

interface EnergyFlowResponse {
  realTime?: RealTimeFlowResponse;
  todayMix?: Partial<TodayEnergyMix>;
  /** Server clock — used only as a last-resort fallback if `measuredAt` is absent. */
  timestamp?: string;
}

// ── Direction inference ──────────────────────────────────────────────────

/**
 * Sign → explicit `in`/`out`/`idle`. `positiveMeaning` names what a positive
 * value means for that channel: grid `+` = importing (`in`), battery `+` =
 * discharging (`out`) — matches the backend convention documented in
 * `energy-flow.engine.ts` and the mobile's `RealTimeFlow.fromJson`.
 *
 * Sub-noise-floor readings are `"idle"` so sensor jitter doesn't animate a
 * flow that isn't really there.
 */
function directionOf(watts: number, positiveMeaning: "in" | "out"): FlowDirection {
  if (Math.abs(watts) < NOISE_FLOOR_W) return "idle";
  if (watts > 0) return positiveMeaning;
  return positiveMeaning === "in" ? "out" : "in";
}

// ── kW → W with defensive parsing ────────────────────────────────────────

const toWatts = (kw: number | undefined): number =>
  typeof kw === "number" && Number.isFinite(kw) ? kw * 1000 : 0;

// ── Response → snapshot ──────────────────────────────────────────────────

/**
 * Turn the backend's `realTime` block into an `EnergyFlowSnapshot`.
 *
 * Sign conventions preserved end-to-end so this mirrors the mobile card:
 *   • gridKw > 0  → import (grid.direction = "in")
 *   • gridKw < 0  → export (grid.direction = "out")
 *   • batteryKw > 0 → discharging (battery.direction = "out")
 *   • batteryKw < 0 → charging   (battery.direction = "in")
 *   • solarKw ≥ 0 always; solar.direction = "out" when producing
 *   • houseKw ≥ 0 always; home.direction  = "in"  when drawing
 *
 * `houseKw` is passed through as the measured consumption — mobile's
 * `homeOverride` — so the House node shows what the backend measured rather
 * than what the solver would infer from the other three legs. The two agree
 * when the meter agrees with the sum; they disagree by exactly the amount of
 * `systemOverheadKw`, which the mobile discloses in the caption below.
 */
export function realTimeToSnapshot(body: EnergyFlowResponse): EnergyFlowSnapshot | null {
  const rt = body.realTime;
  if (!rt) return null;

  const solarW = Math.max(0, toWatts(rt.solarKw));
  const houseW = Math.max(0, toWatts(rt.houseKw));
  const gridW = toWatts(rt.gridKw);
  const batteryW = toWatts(rt.batteryKw);
  const overheadW = Math.max(0, toWatts(rt.systemOverheadKw));

  // Net at the meter, in kW, for the human label. Positive = house is a net
  // exporter this instant. `gridKw` is already the net at the meter, so the
  // label reads it directly — no re-derivation, no rounding drift.
  const netKw = typeof rt.gridKw === "number" ? -rt.gridKw : 0;
  const netTone: EnergyFlowSnapshot["netTone"] =
    Math.abs(netKw) < 0.05 ? "neutral" : netKw > 0 ? "positive" : "negative";
  const netLabel =
    Math.abs(netKw) < 0.05
      ? "Net zero"
      : `${Math.abs(netKw).toFixed(2)} kW ${netKw > 0 ? "export" : "draw"}`;

  // Prefer the inverter's `measuredAt`; fall back to the server timestamp so
  // ageing never runs against `Date.now()` at fetch time (that would always
  // read "just now" and hide a stale/offline system).
  const updatedAt = rt.measuredAt ?? body.timestamp ?? new Date(0).toISOString();

  return {
    solar: { watts: solarW, direction: solarW > NOISE_FLOOR_W ? "out" : "idle" },
    battery: {
      watts: Math.abs(batteryW),
      direction: directionOf(batteryW, "out"),
      soc: Math.max(0, Math.min(100, Math.round(rt.batteryPercent ?? 0))),
      label: "Battery",
    },
    grid: { watts: Math.abs(gridW), direction: directionOf(gridW, "in") },
    home: { watts: houseW, direction: houseW > NOISE_FLOOR_W ? "in" : "idle" },
    ...(overheadW > 0 ? { systemOverheadWatts: overheadW } : {}),
    updatedAt,
    netLabel,
    netTone,
  };
}

// ── Freshness ────────────────────────────────────────────────────────────

/**
 * Classify a snapshot's age. Mirrors mobile's `freshnessOf` (in
 * `data_provenance.dart`), so both surfaces flip to "stale" and "offline" on
 * exactly the same schedule.
 */
export function freshnessOf(updatedAt: string, now: Date): Freshness {
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t) || t <= 0) return "awaitingFirstData";
  const ageMs = now.getTime() - t;
  if (ageMs >= LIVE_MAX_AGE_MS) return "offline";
  if (ageMs >= FRESH_FOR_MS) return "stale";
  return "fresh";
}

// ── Fetcher (usable from both server and route handlers) ────────────────

/**
 * Discriminated result. Every failure mode carries a specific reason so the
 * page can render an accurate empty state instead of silently swapping in
 * demo values (the historic cause of "why do web and mobile disagree?" —
 * the two were showing different data sources with the same UI, and the
 * fallback was invisible).
 */
export type EnergyFlowFetchResult =
  | { status: "ok"; snapshot: EnergyFlowSnapshot; todayMix: TodayEnergyMix | null }
  | { status: "no-property" } // 404 from activePropertyResolver
  | { status: "no-data" } // 200 with missing `realTime`
  | { status: "http-error"; code: number }
  | { status: "network-error" };

/**
 * Read the six cumulative-total fields out of the response body, coercing
 * anything non-numeric (missing, string, NaN) to `null`. Returns null if
 * the block itself is absent — the caller then knows the endpoint answered
 * but didn't include totals (a real state for a freshly linked inverter).
 */
export function todayMixOf(body: EnergyFlowResponse): TodayEnergyMix | null {
  const raw = body.todayMix;
  if (!raw) return null;
  const num = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  return {
    solarGeneratedKwh: num(raw.solarGeneratedKwh),
    houseConsumedKwh: num(raw.houseConsumedKwh),
    batteryStoredKwh: num(raw.batteryStoredKwh),
    batteryDischargedKwh: num(raw.batteryDischargedKwh),
    exportedToGridKwh: num(raw.exportedToGridKwh),
    importedFromGridKwh: num(raw.importedFromGridKwh),
  };
}

/**
 * Fetch the aggregated energy-flow snapshot from the backend.
 *
 * `cookieHeader` is passed through so the backend can identify the user —
 * this is called both from a server component (which forwards `next/headers`
 * cookies) and from a Next.js route handler (which does the same for the
 * browser-originated poll).
 *
 * `propertyId`, when provided, is forwarded as `X-Property-Id`. The mobile
 * app does this on every eb-auth request (see
 * `energiebeemobile/lib/app/di/network_providers.dart` — the DIO interceptor
 * at line 213). Without it, the backend's `activePropertyResolver` falls
 * back to Redis / user default / first-non-archived, which can silently
 * resolve a DIFFERENT home than the one the mobile app is showing when a
 * user has more than one — the biggest source of "why do the numbers
 * disagree?" between the two surfaces.
 */
export async function fetchEnergyFlowSnapshot(
  cookieHeader: string,
  options: { propertyId?: string | undefined } = {},
): Promise<EnergyFlowFetchResult> {
  const apiUrl = process.env["API_URL"] ?? "http://localhost:4000";
  const headers: Record<string, string> = { Cookie: cookieHeader };
  if (options.propertyId) headers["X-Property-Id"] = options.propertyId;

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/api/energy-profile/energy-flow`, {
      headers,
      cache: "no-store",
    });
  } catch {
    return { status: "network-error" };
  }

  // 404 is specifically the "no active property" signal from the resolver
  // (see `activePropertyResolver` in eb-auth). Distinguished from other
  // non-2xx codes so the UI can point the user at "add a home" rather than
  // "the backend is broken".
  if (res.status === 404) return { status: "no-property" };
  if (!res.ok) return { status: "http-error", code: res.status };

  let body: EnergyFlowResponse;
  try {
    body = (await res.json()) as EnergyFlowResponse;
  } catch {
    return { status: "http-error", code: res.status };
  }

  const snapshot = realTimeToSnapshot(body);
  if (snapshot === null) return { status: "no-data" };
  return { status: "ok", snapshot, todayMix: todayMixOf(body) };
}
