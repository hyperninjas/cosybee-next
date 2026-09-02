/**
 * Fetch + bucket SunSync telemetry into the `PowerHistory` shape the dashboard
 * chart consumes.
 *
 * Ports the mobile's `sunsynk_telemetry_provider.dart` `bucketReadings` — the
 * two surfaces read from the SAME `/api/sunsynk/telemetry` endpoint and bucket
 * the SAME way, so a customer looking at web and mobile side-by-side sees
 * identical shapes for the same UK day. The mobile bucket width is 15 minutes
 * (96 points/day — dense enough for a passing cloud, sparse enough to stay
 * smooth); we match it here.
 *
 * ### Sign conventions (from InverterReading dart doc)
 *
 * | Field       | Positive          | Negative      |
 * | ----------- | ----------------- | ------------- |
 * | solarW      | generating        | (never)       |
 * | gridW       | importing         | exporting     |
 * | batteryW    | discharging       | charging      |
 *
 * The chart's `PowerHistoryPoint` mirrors those signs directly — `grid > 0`
 * draws above zero (import), `grid < 0` draws below (export); same for
 * battery. Do NOT flip a sign here without also flipping the assertion in
 * mobile's `live_data_models_test.dart` (see the doc block in
 * `energiebeemobile/lib/features/phase1/domain/models/inverter_reading.dart:60`).
 */

import type { PowerHistoryPoint } from "@/app/components/sections/energyflow-home";
import { toUkWallClock, ukDayStartUtc } from "./uk-time";

/** Hard upstream retention wall — matches eb-auth `INTRADAY_RETENTION_DAYS`. */
export const HISTORY_RETENTION_DAYS = 90;

/**
 * Bucket width in minutes. 288 points/day at 5 min — matches the raw
 * upstream cadence, so the chart shows every reading rather than an average.
 *
 * The mobile buckets at 15 min because it draws a smoothed curve, and
 * smoothing on top of averaging washes short-lived spikes (cloud pass,
 * stove pulse) out entirely. The web reference chart is a raw jagged
 * silhouette instead, so keep the input at the source resolution.
 */
const BUCKET_MINUTES = 5;

// ── Wire types (subset we consume) ───────────────────────────────────────

/**
 * One row of the eb-auth `/api/sunsynk/telemetry` response. Only the fields
 * the chart needs are typed — `batterySocPct` is deliberately ignored here
 * since the chart doesn't render it.
 */
interface TelemetryReading {
  recordedAt: string;
  solarW: number;
  gridW: number;
  loadW: number;
  batteryW: number;
}

interface TelemetryResponse {
  count: number;
  readings: TelemetryReading[];
}

// ── Discriminated result ─────────────────────────────────────────────────

/**
 * Every failure mode is named so the caller can pick the right empty state
 * (matches the pattern established by `energy-flow.ts` — silent fallback to
 * demo shape was the cause of "why do web and mobile disagree?").
 */
export type PowerHistoryFetchResult =
  | { status: "ok"; points: PowerHistoryPoint[] }
  | { status: "no-property" }
  | { status: "no-data" }
  | { status: "out-of-range" }
  | { status: "http-error"; code: number }
  | { status: "network-error" };

// ── Fetcher ──────────────────────────────────────────────────────────────

/**
 * Fetch a UK day's worth of readings and bucket them.
 *
 * `dayStartUtc` must be the UTC instant of UK midnight (use `ukDayStartUtc`
 * on the target day). Clamped upstream: today ≥ day ≥ 89 days ago, otherwise
 * returns `out-of-range` — the backend won't hold intraday data older than
 * that (see `HISTORY_RETENTION_DAYS`).
 *
 * `cookieHeader` and `propertyId` behave exactly like `fetchEnergyFlowSnapshot`
 * — the cookie carries the session, and `X-Property-Id` pins the fetch to
 * the same home the rest of the dashboard is rendering.
 */
export async function fetchPowerHistory(
  cookieHeader: string,
  options: { propertyId?: string | undefined; dayStartUtc: Date },
): Promise<PowerHistoryFetchResult> {
  const { propertyId, dayStartUtc } = options;

  // Bounds check — cheaper than a round-trip that will return an empty
  // window anyway. Compare against UK-day starts on both ends so a request
  // for "89 days ago" doesn't fall on the wrong side by an hour's DST drift.
  const now = new Date();
  const todayStart = ukDayStartUtc(now);
  const oldest = new Date(
    todayStart.getTime() - HISTORY_RETENTION_DAYS * 86_400_000,
  );
  if (dayStartUtc < oldest || dayStartUtc > now) {
    return { status: "out-of-range" };
  }

  const dayEndUtc = new Date(dayStartUtc.getTime() + 86_400_000);
  const apiUrl = process.env["API_URL"] ?? "http://localhost:4000";
  const query = new URLSearchParams({
    from: dayStartUtc.toISOString(),
    to: dayEndUtc.toISOString(),
  });
  const headers: Record<string, string> = { Cookie: cookieHeader };
  if (propertyId) headers["X-Property-Id"] = propertyId;

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/api/sunsynk/telemetry?${query}`, {
      headers,
      cache: "no-store",
    });
  } catch {
    return { status: "network-error" };
  }

  if (res.status === 404) return { status: "no-property" };
  if (!res.ok) return { status: "http-error", code: res.status };

  let body: TelemetryResponse;
  try {
    body = (await res.json()) as TelemetryResponse;
  } catch {
    return { status: "http-error", code: res.status };
  }

  const readings = Array.isArray(body.readings) ? body.readings : [];
  if (readings.length === 0) return { status: "no-data" };

  return { status: "ok", points: bucketReadings(readings) };
}

// ── Bucketing ────────────────────────────────────────────────────────────

/**
 * Average readings into fixed 15-minute UK-wall-clock buckets.
 *
 * A UK-wall-clock key means the buckets align with the customer's day
 * regardless of DST — 09:00 in June and 09:00 in December fall in the same
 * bucket label. Empty buckets are dropped (the mobile does the same); the
 * chart's X-axis is label-driven, so gaps in the timeline appear as gaps.
 */
export function bucketReadings(
  readings: TelemetryReading[],
): PowerHistoryPoint[] {
  if (readings.length === 0) return [];

  // Map key: UK wall-clock milliseconds at the bucket boundary. Numeric
  // keys sort trivially and the "HH:MM" label reads straight off the same
  // wall-clock Date via its UTC fields (`toUkWallClock` returns a Date
  // whose UTC fields carry UK values by construction).
  const buckets = new Map<number, TelemetryReading[]>();
  for (const reading of readings) {
    const at = new Date(reading.recordedAt);
    if (!Number.isFinite(at.getTime())) continue;
    const wall = toUkWallClock(at);
    const bucketMinute =
      wall.getUTCMinutes() - (wall.getUTCMinutes() % BUCKET_MINUTES);
    const key = Date.UTC(
      wall.getUTCFullYear(),
      wall.getUTCMonth(),
      wall.getUTCDate(),
      wall.getUTCHours(),
      bucketMinute,
    );
    const arr = buckets.get(key) ?? [];
    arr.push(reading);
    buckets.set(key, arr);
  }

  const sortedKeys = [...buckets.keys()].sort((a, b) => a - b);
  return sortedKeys.map((key) => {
    const group = buckets.get(key) ?? [];
    const mean = (pick: (r: TelemetryReading) => number): number =>
      group.reduce((sum, r) => sum + pick(r), 0) / group.length;
    return {
      time: hhMmFromWallMs(key),
      solar: kw(mean((r) => r.solarW)),
      home: kw(mean((r) => r.loadW)),
      grid: kw(mean((r) => r.gridW)),
      battery: kw(mean((r) => r.batteryW)),
    };
  });
}

// ── Formatting helpers ───────────────────────────────────────────────────

/** Watts → kW, rounded to 2 dp so tooltips read cleanly. */
function kw(watts: number): number {
  return Math.round((watts / 1000) * 100) / 100;
}

/**
 * "HH:MM" from a UK-wall-clock ms (the bucket key format). Reads UTC fields
 * off the Date because the key already has the UK offset baked in.
 */
function hhMmFromWallMs(wallMs: number): string {
  const d = new Date(wallMs);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}
