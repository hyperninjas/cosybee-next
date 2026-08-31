/**
 * Same-origin poll target for the client-side EnergyFlowDiagramLive wrapper.
 *
 * The upstream `/api/energy-profile/energy-flow` sits behind `API_URL` (a
 * server-only env var — the browser doesn't know that host and the CSP
 * doesn't allow it). This handler forwards the browser's cookies to the
 * backend, maps the response through the same `realTimeToSnapshot` used by
 * the SSR path, and returns the snapshot as JSON.
 *
 * The initial paint still uses the server-side fetch in `dashboard-data.ts`,
 * so a fresh page load never waits for this handler; polling only kicks in
 * once the client component mounts.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchEnergyFlowSnapshot } from "@/app/lib/energy-flow";
import { getActiveProperty } from "@/app/lib/property-state";

// Route handlers default to node runtime for this app; no runtime override
// needed. `dynamic = "force-dynamic"` prevents Next from trying to cache the
// route at build time — every call must hit the upstream fresh.
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (cookieHeader.length === 0) {
    return NextResponse.json({ status: "network-error" });
  }
  // Pin the poll to the SAME home the SSR path resolved — otherwise a
  // multi-property user could see the diagram flip between homes as the
  // backend's fallback chain resolves them differently across requests.
  const property = await getActiveProperty();
  const result = await fetchEnergyFlowSnapshot(cookieHeader, {
    propertyId: property?.id,
  });
  return NextResponse.json(result);
}
