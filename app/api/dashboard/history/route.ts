/**
 * Same-origin fetch target for the client-side date-navigation on the Power
 * History chart. The upstream `/api/sunsynk/telemetry` lives behind `API_URL`
 * (server-only env — the browser doesn't know that host and the CSP doesn't
 * allow it), so the client hits THIS handler; the handler forwards cookies
 * to the backend, buckets the readings, and returns the chart-ready JSON.
 *
 * Initial paint uses the server-side fetch in `dashboard-data.ts`, so a fresh
 * page load never waits for this handler; it only runs when the user picks a
 * different day.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  fetchPowerHistory,
  type PowerHistoryFetchResult,
} from "@/app/lib/sunsync-history";
import { parseUkDateParam, ukDateParam } from "@/app/lib/uk-time";
import { getActiveProperty } from "@/app/lib/property-state";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse<PowerHistoryFetchResult>> {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");

  let dayStartUtc: Date;
  try {
    // Missing `date` → today's UK day. Anything else that fails to parse is
    // a client bug (typo in a hand-crafted URL) — surface it as a specific
    // status the chart can render, rather than a generic 400.
    const iso = dateParam ?? ukDateParam(new Date());
    dayStartUtc = parseUkDateParam(iso);
  } catch {
    return NextResponse.json<PowerHistoryFetchResult>({ status: "out-of-range" });
  }

  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (cookieHeader.length === 0) {
    return NextResponse.json<PowerHistoryFetchResult>({ status: "network-error" });
  }

  // Pin to the same home the SSR path resolved — see the note in
  // app/api/dashboard/energy-flow/route.ts for why every dashboard read is
  // pinned via `X-Property-Id` rather than relying on the backend fallback.
  const property = await getActiveProperty();
  const result = await fetchPowerHistory(cookieHeader, {
    propertyId: property?.id,
    dayStartUtc,
  });
  return NextResponse.json<PowerHistoryFetchResult>(result);
}
