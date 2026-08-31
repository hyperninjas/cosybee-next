"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for managing an already-connected provider link.
 *
 * Sits alongside `connect-actions.ts` (which owns the initial connect) —
 * split by lifecycle: connect (onboarding) vs manage (post-connect
 * housekeeping — disconnect, switch inverter). Both files talk to the same
 * eb-auth endpoints, share the cookie-forward pattern, and revalidate the
 * dashboard on success.
 *
 * Every action here mirrors an endpoint the mobile app already uses (see
 * `energiebeemobile/lib/app/network/eb_auth/sunsynk_service.dart` and its
 * Octopus sibling), so the web is only catching up on parity — no new
 * backend surface.
 */

const API_URL = process.env["API_URL"] ?? "http://localhost:4000";

/** Discriminated result the client uses to decide "close modal" vs "show error". */
export type ProviderActionResult =
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

/** Read the backend's `{message, code}` error envelope defensively. */
async function readError(res: Response, fallback: string): Promise<ProviderActionResult> {
  const body = (await res.json().catch(() => null)) as
    | { message?: string; code?: string }
    | null;
  return {
    ok: false,
    error: body?.message ?? fallback,
    ...(body?.code ? { code: body.code } : {}),
  };
}

// ── Disconnect ───────────────────────────────────────────────────────────

/**
 * Unlink the SunSync account for the active property. The backend keeps
 * historical readings tied to the property so they survive re-connect;
 * only the live credentials + live sync stop. Mirrors mobile's disconnect.
 */
export async function disconnectSunSync(): Promise<ProviderActionResult> {
  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  try {
    const res = await fetch(`${API_URL}/api/sunsynk/connect`, {
      method: "DELETE",
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) return readError(res, "Couldn't disconnect SunSync.");
    revalidatePath("/energyflow-home");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the service. Try again in a moment." };
  }
}

/**
 * Unlink the Octopus account for the active property. Same semantics as
 * SunSync disconnect — historical data stays, live sync stops.
 */
export async function disconnectOctopus(): Promise<ProviderActionResult> {
  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  try {
    const res = await fetch(`${API_URL}/api/octopus/connect`, {
      method: "DELETE",
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) return readError(res, "Couldn't disconnect Octopus.");
    revalidatePath("/energyflow-home");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the service. Try again in a moment." };
  }
}

// ── Switch inverter (SunSync only) ───────────────────────────────────────

/**
 * A single inverter on a linked plant, as returned by
 * `GET /api/sunsynk/connection/plants`. Only the fields the picker needs.
 */
export interface LinkedInverter {
  serial: string;
  label: string;
  /** True when this is the inverter the dashboard currently reads. */
  isCurrent: boolean;
}

/** One plant (site) with its inverters. */
export interface LinkedPlant {
  id: string;
  label: string;
  inverters: LinkedInverter[];
}

export type LinkedPlantsResult =
  | { ok: true; plants: LinkedPlant[] }
  | { ok: false; error: string };

/**
 * List the SunSync plants + inverters on the linked account, alongside a
 * flag marking whichever plant/inverter is currently being read. No
 * credentials are needed — the backend reuses the stored ones.
 *
 * Runs as a Server Action so the browser never sees `API_URL` and never
 * needs a cookie header of its own.
 */
export async function listSunSyncPlants(): Promise<LinkedPlantsResult> {
  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  try {
    const res = await fetch(`${API_URL}/api/sunsynk/connection/plants`, {
      method: "GET",
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await readError(res, "Couldn't fetch your SunSync plants.");
      // `readError` returns the disconnect/switch shape; narrow to the
      // list-plants failure shape by re-throwing just the error string.
      const message = err.ok ? "Couldn't fetch your SunSync plants." : err.error;
      return { ok: false, error: message };
    }
    // The backend envelope. Defensive parsing — every field defaulted so a
    // minor upstream tweak (e.g. renaming `inverterSerial` to `serial`) doesn't
    // blow up the picker; the strict source of truth is the backend's own
    // response schema in `sunsynk.controller.ts`.
    const body = (await res.json()) as {
      plants?: Array<{
        id?: string;
        label?: string;
        inverters?: Array<{
          serial?: string;
          label?: string;
          isCurrent?: boolean;
        }>;
      }>;
    };
    const plants: LinkedPlant[] = (body.plants ?? []).map((p) => ({
      id: String(p.id ?? ""),
      label: String(p.label ?? p.id ?? "Unnamed site"),
      inverters: (p.inverters ?? []).map((inv) => ({
        serial: String(inv.serial ?? ""),
        label: String(inv.label ?? inv.serial ?? "Inverter"),
        isCurrent: inv.isCurrent === true,
      })),
    }));
    return { ok: true, plants };
  } catch {
    return { ok: false, error: "Couldn't reach SunSync. Try again in a moment." };
  }
}

/**
 * Re-point the SunSync link at a different plant / inverter.
 *
 * 🔴 Destructive: the backend deletes the previously linked inverter's
 * readings, daily totals, and intraday ledger, because those tables key on
 * `propertyId` alone and cannot distinguish two systems. That's why the
 * endpoint requires the explicit `confirmDiscardHistory: true` toggle —
 * hardcoding it here would defeat the purpose. The UI must obtain the
 * consent from the user first and pass it through.
 */
export async function switchSunSyncSelection(input: {
  plantId: string;
  inverterSerial: string;
  confirmDiscardHistory: boolean;
}): Promise<ProviderActionResult> {
  if (!input.confirmDiscardHistory) {
    return { ok: false, error: "You must confirm the previous inverter's history will be discarded." };
  }
  if (input.plantId.length === 0 || input.inverterSerial.length === 0) {
    return { ok: false, error: "Pick a plant and inverter." };
  }

  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  try {
    const res = await fetch(`${API_URL}/api/sunsynk/connection/selection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        plantId: input.plantId,
        inverterSerial: input.inverterSerial,
        confirmDiscardHistory: true,
      }),
      cache: "no-store",
    });
    if (!res.ok) return readError(res, "Couldn't switch to that inverter.");
    revalidatePath("/energyflow-home");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach SunSync. Try again in a moment." };
  }
}
