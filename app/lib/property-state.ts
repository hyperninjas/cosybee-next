import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

/**
 * Server-side helper that answers "does this user have an active home?".
 *
 * eb-auth's SunSync / Octopus connect endpoints all live behind the
 * `activePropertyResolver` middleware. Without a resolvable property the
 * middleware throws with the human-readable "No active property. Create
 * one via POST /api/properties first." — the message we hit today when
 * the seeded admin user tried to connect Octopus.
 *
 * The frontend's Tier-0 empty state therefore needs to gate its provider
 * CTAs on whether the user has a property. This helper returns:
 *   - `null` if no property exists yet (or the backend is unreachable);
 *   - a compact summary of the active one if one does.
 * Same cookie-forwarding + React `cache()` pattern the other server
 * helpers use.
 */

const API_URL = process.env.API_URL || "http://localhost:4000";

export interface ActiveProperty {
  id: string;
  label: string;
  address: string;
  postcode: string;
}

async function cookieHeader(): Promise<string | null> {
  const store = await cookies();
  const header = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return header.length > 0 ? header : null;
}

/**
 * Fetch the user's properties. Returns the first non-archived one because
 * that matches how the backend resolver falls back when neither the
 * `X-Property-Id` header nor the durable default is set — same choice keeps
 * the UI and the API consistent about "which home is this".
 */
/**
 * Fetch and normalise the user's non-archived properties. Shared by both
 * `getActiveProperty` (which just picks the first) and the property-switcher
 * dropdown (which needs the full list). One HTTP call per render thanks to
 * React `cache()`.
 */
export const listProperties = cache(async (): Promise<ActiveProperty[]> => {
  const cookie = await cookieHeader();
  if (cookie === null) return [];

  try {
    const res = await fetch(`${API_URL}/api/properties`, {
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as {
      data?: Array<{
        id: string;
        label: string;
        address: string;
        postcode: string;
        isArchived: boolean;
      }>;
    };
    return (body.data ?? [])
      .filter((p) => !p.isArchived)
      .map((p) => ({
        id: p.id,
        label: p.label,
        address: p.address,
        postcode: p.postcode,
      }));
  } catch {
    return [];
  }
});

export const getActiveProperty = cache(async (): Promise<ActiveProperty | null> => {
  const list = await listProperties();
  return list[0] ?? null;
});
