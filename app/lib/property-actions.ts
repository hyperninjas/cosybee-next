"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  readActivePropertyId,
  writeActivePropertyId,
} from "./active-property-header";

/**
 * Server Actions for switching the currently active property.
 *
 * The mobile app's Dio interceptor sends `X-Property-Id: <active>` on every
 * eb-auth request (see `energiebeemobile/lib/app/di/network_providers.dart`).
 * Web reaches the same steady state by pairing the backend's Redis-marker
 * activation with a browser cookie (see `active-property-header.ts`) so
 * every subsequent server-side fetch can inject `X-Property-Id` from the
 * cookie without a client-side store — matching mobile's contract with
 * the shape server components actually run in.
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
    // Write the browser cookie in the SAME response the backend activation
    // returns in. Server-side that means every subsequent fetcher can add
    // `X-Property-Id` without another round-trip, and closes the small
    // window in which a request could arrive between the backend Redis
    // marker being set and the durable defaultPropertyId being read — the
    // race that made switch-home look flaky in one prior report.
    await writeActivePropertyId(propertyId);
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

/**
 * Result-with-payload variant for archive so the caller knows which home
 * became active on our behalf (or that none did — the archived one was
 * already inactive). The dashboard uses this to decide whether to
 * `router.refresh()` immediately (the active home changed under it) or
 * to trust the standard `revalidatePath`.
 */
export type ArchivePropertyResult =
  | { ok: true; newActivePropertyId: string | null }
  | { ok: false; error: string; code?: string };

/**
 * Archive a property and re-scope the active home if we just archived
 * it. Mirrors the mobile behaviour in
 * `energiebeemobile/lib/features/address_switcher/presentation/viewmodel/
 * saved_addresses_provider.dart:137` — the switcher removes the row,
 * and if it was active it re-scopes to the first remaining home.
 *
 * The backend does its own repointing of `User.defaultPropertyId` when
 * the archived id was the default (see `properties.service.ts:220`),
 * but the RUNTIME active property lives in two other places: the Redis
 * session marker and our browser cookie. Neither gets touched by
 * archive alone. So this action does what mobile does: pick the first
 * remaining non-archived home and `activateProperty` onto it, which
 * refreshes both the marker and our cookie in one shot.
 *
 * Returns `newActivePropertyId` so the caller can decide whether to
 * force a `router.refresh()` (the whole dashboard now reads a different
 * home) or trust the `revalidatePath` alone (the archived home wasn't
 * active). `null` means "no reactivation needed" — either the archived
 * home wasn't active, or there are zero homes left and the user will
 * bounce to `/onboarding/address` on the next request anyway.
 */
export async function archiveProperty(
  propertyId: string,
): Promise<ArchivePropertyResult> {
  if (propertyId.trim().length === 0) return { ok: false, error: "Missing property id." };

  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  try {
    const res = await fetch(
      `${API_URL}/api/properties/${encodeURIComponent(propertyId)}/archive`,
      {
        method: "POST",
        headers: { Cookie: cookie },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string; code?: string }
        | null;
      return {
        ok: false,
        error: body?.message ?? "Couldn't archive that home.",
        ...(body?.code ? { code: body.code } : {}),
      };
    }

    // If the archived home was ALSO the currently-active home from our
    // cookie's point of view, re-scope. Reading the cookie rather than
    // calling `getActiveProperty()` because the latter would list the
    // homes right after the archive write — a stale read is possible
    // while the backend commit propagates, and we already know our
    // cookie's answer synchronously.
    const activeId = await readActivePropertyId();
    if (activeId !== propertyId) {
      revalidatePath("/dashboard");
      return { ok: true, newActivePropertyId: null };
    }

    // Re-scope onto the first remaining home. Local import — avoids
    // pulling the property fetcher into every action that imports this
    // file, and matches the pattern in `server-session.ts`.
    const { listProperties } = await import("./property-state");
    const remaining = await listProperties();
    // `listProperties` already filters out archived rows, so the freshly
    // archived id will not appear.
    const next = remaining[0]?.id ?? null;
    if (next === null) {
      // Zero homes left. Clear our cookie so the next fetch doesn't
      // send `X-Property-Id: <archived>` — the backend would 404 on it.
      // `revalidatePath` will bounce the user to `/onboarding/address`
      // via `requireOnboarded`; no `activateProperty` is needed
      // (there's nothing to activate).
      const { clearActivePropertyId } = await import("./active-property-header");
      await clearActivePropertyId();
      revalidatePath("/dashboard");
      return { ok: true, newActivePropertyId: null };
    }

    // Re-fire the activate action so cookie + Redis marker + durable
    // default all move together. `activateProperty` also runs its own
    // `revalidatePath`, so we don't double-invalidate here.
    const activateResult = await activateProperty(next);
    if (!activateResult.ok) {
      // Archive succeeded but reactivation failed — a rare combination.
      // Report as a "partial" so the client at least refreshes.
      revalidatePath("/dashboard");
      return { ok: true, newActivePropertyId: null };
    }
    return { ok: true, newActivePropertyId: next };
  } catch {
    return { ok: false, error: "Couldn't reach the service. Try again in a moment." };
  }
}
