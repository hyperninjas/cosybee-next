import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { readActivePropertyId } from "./active-property-header";

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

/**
 * Property projection surfaced to every page that reads a home. Mirrors the
 * mobile `Property` DTO (`energiebeemobile/lib/features/properties/domain/
 * property.dart:14`) — see `multi-property-flutter-guide.md` §2 for the
 * authoritative shape — so the same fields drive the same downstream cards
 * on both surfaces (weather forecasts, EPC refresh, address de-duplication,
 * archived-home filtering).
 *
 * Historically this file returned only `{ id, label, address, postcode }`
 * because that was all the dashboard's ProviderStatusBar tile needed.
 * Widening here rather than adding a second "detailed property" endpoint
 * because there's one `GET /api/properties` upstream and one React `cache()`
 * per render — a second projection would fetch the same JSON twice.
 *
 * 🔴 `label` / `address` / `postcode` intentionally stay non-nullable at
 * this boundary: the backend column is nullable, but every caller today
 * either displays the value or falls back on an "Untitled home" copy, so
 * coalescing to `""` here keeps the render sites free of `?? "…"` noise.
 * `uprn`, `houseRef`, `currentEpcId` stay `string | null` because we DO
 * distinguish "missing" from "empty" for those (a null `currentEpcId`
 * gates the "refine estimate" CTA).
 */
export interface ActiveProperty {
  id: string;
  ownerId: string;
  label: string;
  address: string;
  postcode: string;
  /** UK Unique Property Reference Number; `null` for non-UK / manually keyed rows. */
  uprn: string | null;
  /** Free-text apartment / unit / subdivision reference, kept opaque here. */
  houseRef: string | null;
  /** ISO 3166-1 alpha-3, defaults to "GBR" backend-side when absent. */
  currentEpcId: string | null;
  /**
   * Property-level geocode from AFD, or `null` when unknown. Backend rejects
   * the literal 0,0 (Gulf of Guinea sanity check) so this side never has
   * to guard for it — a missing coordinate is genuinely null.
   */
  latitude: number | null;
  longitude: number | null;
  /**
   * Present but always `false` on rows returned by `listProperties()` —
   * that helper filters archived out at the boundary. Kept in the shape
   * so callers that opt into `includeArchived=true` in a follow-up don't
   * have to widen the type again.
   */
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
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
/**
 * Raw shape from `GET /api/properties`. Every field is optional/nullable on
 * the wire — the mapper below applies the "empty string is fine for
 * label/address/postcode, but everything else stays nullable" rule. Kept
 * inline so it can't leak into consumers as a public type — the public
 * type is `ActiveProperty`.
 */
interface PropertyDTO {
  id: string;
  ownerId: string;
  label: string | null;
  address: string | null;
  postcode: string | null;
  uprn: string | null;
  houseRef: string | null;
  currentEpcId: string | null;
  latitude: number | null;
  longitude: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const listProperties = cache(async (): Promise<ActiveProperty[]> => {
  const cookie = await cookieHeader();
  if (cookie === null) return [];

  try {
    const res = await fetch(`${API_URL}/api/properties`, {
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: PropertyDTO[] };
    return (body.data ?? [])
      .filter((p) => !p.isArchived)
      .map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        // The next three coalesce nullable columns to "" so consumers can
        // render without `?? "…"` noise. Every caller today either
        // displays the value directly or already substitutes an
        // "Untitled home" fallback when it's blank — "" is fine.
        label: p.label ?? "",
        address: p.address ?? "",
        postcode: p.postcode ?? "",
        uprn: p.uprn,
        houseRef: p.houseRef,
        currentEpcId: p.currentEpcId,
        latitude: p.latitude,
        longitude: p.longitude,
        isArchived: p.isArchived,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
  } catch {
    return [];
  }
});

/**
 * Return the currently-active property.
 *
 * 🔴 Do NOT change this back to `list[0]`. That form of the helper
 * caused a real user-visible bug on 2026-09-22: the Sunsynk tile went
 * green with "Synced 2 min ago" while the flow diagram sat on "No
 * inverter reading yet". Two endpoints, two different property ids —
 * connection-state read the cookie (via `withPropertyHeader`) and
 * resolved to the property whose readings had actually landed, while
 * dashboard-data called `getActiveProperty()` and forwarded `list[0]`
 * as `X-Property-Id` on the flow fetch. When `list[0]` was a
 * DIFFERENT home (a user with three properties who had switched away
 * from the first), the flow endpoint targeted a property with no
 * readings and returned the modelled fallback, which the frontend
 * guard then hid as "no data".
 *
 * The fix is to make this the same source of truth as the other
 * property-scoped fetchers: the browser cookie set by
 * {@link activateProperty}. If the cookie is present AND matches a
 * non-archived home in the list, that's the answer. Otherwise fall
 * through to `list[0]` — the same fallback the backend resolver uses
 * when it has no session marker and no `defaultPropertyId`, so first-
 * time and freshly-signed-in users get the same home they would have
 * without this helper existing.
 *
 * A stale cookie (points to an archived home, or a home the user no
 * longer owns) also falls through to `list[0]` because `list` is
 * already filtered to non-archived rows — no risk of returning an
 * archived one.
 */
export const getActiveProperty = cache(async (): Promise<ActiveProperty | null> => {
  const list = await listProperties();
  if (list.length === 0) return null;
  const activeId = await readActivePropertyId();
  if (activeId !== null) {
    const found = list.find((p) => p.id === activeId);
    if (found) return found;
  }
  return list[0]!;
});
