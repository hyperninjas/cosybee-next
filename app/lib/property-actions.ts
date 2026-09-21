"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for switching the currently active property.
 *
 * The mobile app's Dio interceptor sends `X-Property-Id: <active>` on every
 * eb-auth request (see `energiebeemobile/lib/app/di/network_providers.dart`).
 * The web reaches the same steady state by calling `POST /api/properties/
 * :id/activate`, which primes both the session-scoped Redis marker
 * (`ep:active:{sessionId}`) and the durable `User.defaultPropertyId`. After
 * that, every subsequent request from the session resolves to the picked
 * home even without the header — matching the mobile behaviour end-to-end.
 */

const API_URL = process.env["API_URL"] ?? "http://localhost:4000";

export type PropertyActionResult =
  | { ok: true }
  | { ok: false; error: string; code?: string };

async function cookieHeader(): Promise<string | null> {
  const store = await cookies();
  const header = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return header.length > 0 ? header : null;
}

/**
 * Set `propertyId` as the active home for the current session. Safe to call
 * even when it is already active — the backend upserts the Redis marker.
 */
export async function activateProperty(propertyId: string): Promise<PropertyActionResult> {
  if (propertyId.trim().length === 0) return { ok: false, error: "Missing property id." };

  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  try {
    const res = await fetch(`${API_URL}/api/properties/${encodeURIComponent(propertyId)}/activate`, {
      method: "POST",
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string; code?: string }
        | null;
      return {
        ok: false,
        error: body?.message ?? "Couldn't switch home.",
        ...(body?.code ? { code: body.code } : {}),
      };
    }
    // Invalidate the dashboard so every server-rendered card re-fetches
    // against the newly active home.
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the service. Try again in a moment." };
  }
}

/**
 * Fields the dashboard's Manage-property dialog can rewrite.
 *
 * Text fields (`label`, `address`, `postcode`) accept `null` to clear a
 * column; `undefined` leaves it untouched. AFD-derived fields (`uprn`,
 * `latitude`, `longitude`) travel together with `address` when the user
 * picks a new AFD result — never entered by hand. That constraint lives
 * in the modal; here we just forward whatever the caller trusted.
 *
 * 🔴 `latitude`/`longitude` land on the backend's postcode-to-region
 * geocode; the backend rejects 0,0 outright (Gulf of Guinea sanity
 * check), so we don't pre-filter it here.
 */
export interface UpdatePropertyInput {
  label?: string | null;
  address?: string | null;
  postcode?: string | null;
  uprn?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Rename / re-address the given property. Only sends the fields the caller
 * actually changed, so an empty field on the form doesn't overwrite a
 * populated column with null by accident.
 */
export async function updateProperty(
  propertyId: string,
  input: UpdatePropertyInput,
): Promise<PropertyActionResult> {
  if (propertyId.trim().length === 0) return { ok: false, error: "Missing property id." };

  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  // Trim strings; blank strings become `null` so a cleared field explicitly
  // clears the DB column rather than storing whitespace. `undefined` values
  // are dropped so a form that only edited `label` doesn't overwrite
  // `address` with anything.
  const payload: Record<string, string | number | null> = {};
  const normaliseString = (v: string | null | undefined): string | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const trimmed = v.trim();
    return trimmed.length === 0 ? null : trimmed;
  };
  const labelN = normaliseString(input.label);
  const addressN = normaliseString(input.address);
  const postcodeN = normaliseString(input.postcode);
  const uprnN = normaliseString(input.uprn);
  if (labelN !== undefined) payload["label"] = labelN;
  if (addressN !== undefined) payload["address"] = addressN;
  if (postcodeN !== undefined) payload["postcode"] = postcodeN;
  if (uprnN !== undefined) payload["uprn"] = uprnN;
  // Coordinates: undefined = untouched, null = clear, number = overwrite.
  // The backend rejects the literal 0,0 (see comment on the input type), so
  // no client-side guard is duplicated here.
  if (input.latitude !== undefined) payload["latitude"] = input.latitude;
  if (input.longitude !== undefined) payload["longitude"] = input.longitude;
  if (Object.keys(payload).length === 0) return { ok: true };

  try {
    const res = await fetch(`${API_URL}/api/properties/${encodeURIComponent(propertyId)}`, {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string; code?: string }
        | null;
      return {
        ok: false,
        error: body?.message ?? "Couldn't save your changes.",
        ...(body?.code ? { code: body.code } : {}),
      };
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the service. Try again in a moment." };
  }
}
