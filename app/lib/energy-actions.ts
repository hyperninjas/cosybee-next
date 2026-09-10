"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for "who supplies your energy, and on what tariff?".
 *
 * This is the web port of mobile's supplier → tariff → monthly-bill chain
 * (`choose_supplier_screen` → `select_tariff_screen` → `set_monthly_bill_screen`).
 * It exists because onboarding previously offered exactly one supplier —
 * Octopus — so the other twenty suppliers in the catalog had no way in, and
 * anyone not with Octopus reached the dashboard with no tariff and therefore
 * no cost figures at all.
 *
 * ### Two things worth knowing
 *
 * **Everything is postcode-scoped.** Tariff rates differ by GB distribution
 * region, so both lists take the active property's postcode. Mobile learned
 * this the hard way: querying before the postcode resolves lands the user on
 * an empty tariff list, which reads as "no tariffs exist" rather than "not
 * loaded yet".
 *
 * **Saving is POST-or-PATCH, decided by the backend.** `/load-profile`
 * returns a conflict if you POST over an existing profile, so
 * {@link saveEnergySetup} asks `/status` first. Same guard mobile uses.
 */

const API_URL = process.env["API_URL"] ?? "http://localhost:4000";

async function cookieHeader(): Promise<string | null> {
  const store = await cookies();
  const header = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return header.length > 0 ? header : null;
}

// ── Types ────────────────────────────────────────────────────────────────

/** One supplier in the catalog. `tariffCount` drives the "N tariffs" caption. */
export interface EnergyProvider {
  id: string;
  name: string;
  slug: string;
  isPopular: boolean;
  tariffCount: number;
}

/**
 * One tariff, trimmed to what the picker actually renders.
 *
 * The API returns far more (Economy 7 splits, gas rates, export rates, break-
 * even night share). Onboarding needs enough to tell two tariffs apart; the
 * rest belongs to the tariff comparison screens, which can read the full
 * shape when they're built.
 */
export interface EnergyTariff {
  id: string;
  name: string;
  providerName: string;
  /** Pre-formatted by the backend, e.g. "24.5p/kWh". Render verbatim. */
  displayRate: string;
  tariffType: string;
  paymentLabel: string;
  contractLabel: string;
  green: boolean;
  standingChargePence: number | null;
}

export type EnergyActionResult = { ok: true } | { ok: false; error: string };

// ── Reads ────────────────────────────────────────────────────────────────

async function getJson<T>(path: string, cookie: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Suppliers with tariffs available for [postcode].
 *
 * Returns `[]` rather than throwing — the step renders an empty-search state,
 * and a catalog blip shouldn't strand someone mid-signup. Pass the postcode
 * whenever it's known; without it the backend falls back to the national
 * catalog, which may list suppliers that don't serve this region.
 */
export async function listEnergyProviders(
  postcode?: string,
): Promise<EnergyProvider[]> {
  const cookie = await cookieHeader();
  if (cookie === null) return [];

  const query = postcode?.trim() ? `?postcode=${encodeURIComponent(postcode.trim())}` : "";
  const rows = await getJson<EnergyProvider[]>(
    `/api/energy-profile/tariffs/providers${query}`,
    cookie,
  );
  if (!Array.isArray(rows)) return [];
  // Popular first, then alphabetical — the same ordering mobile's list uses,
  // so someone switching device finds their supplier in the same place.
  return [...rows].sort((a, b) => {
    if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Tariffs offered by [providerId] in [postcode]'s region. */
export async function listTariffs(
  providerId: string,
  postcode?: string,
): Promise<EnergyTariff[]> {
  if (providerId.trim().length === 0) return [];
  const cookie = await cookieHeader();
  if (cookie === null) return [];

  const query = postcode?.trim() ? `?postcode=${encodeURIComponent(postcode.trim())}` : "";
  const rows = await getJson<EnergyTariff[]>(
    `/api/energy-profile/tariffs/${encodeURIComponent(providerId)}${query}`,
    cookie,
  );
  return Array.isArray(rows) ? rows : [];
}

/**
 * The tariff this property is set up on, or null when none is chosen yet.
 *
 * Every display string here is formatted by the backend — `displayTariff`
 * ("EDF Energy — PAYG Simply Fixed 2Yr Aug28v3") and `displayBill`
 * ("£120.00/month"). Render them verbatim rather than reassembling from the
 * parts: the backend owns how a tariff names itself, and mobile shows the
 * same strings, so rebuilding them here is how the two clients drift.
 */
export interface EnergySetup {
  providerName: string;
  tariffName: string;
  /** Provider and tariff as one line, backend-formatted. */
  displayTariff: string;
  /** Monthly spend as currency, backend-formatted. */
  displayBill: string;
  /** Estimated daily consumption derived from the bill and tariff. */
  dailyKwh: number | null;
}

export async function getEnergySetup(): Promise<EnergySetup | null> {
  const cookie = await cookieHeader();
  if (cookie === null) return null;

  // 404 is the normal answer before a tariff is chosen, not a failure.
  const row = await getJson<{
    providerName?: string;
    tariffName?: string;
    displayTariff?: string;
    displayBill?: string;
    dailyKwh?: number | null;
  }>("/api/energy-profile/load-profile", cookie);
  if (row === null || typeof row.tariffName !== "string") return null;

  return {
    providerName: row.providerName ?? "",
    tariffName: row.tariffName,
    displayTariff: row.displayTariff ?? row.tariffName,
    displayBill: row.displayBill ?? "",
    dailyKwh: typeof row.dailyKwh === "number" ? row.dailyKwh : null,
  };
}

// ── Write ────────────────────────────────────────────────────────────────

/**
 * Save the chosen supplier, tariff and monthly spend.
 *
 * `monthlyBillGbp` is what the customer typed in pounds; the API stores
 * pence, so the conversion happens here rather than in the form — a rounding
 * rule is a backend contract, not a UI detail.
 */
export async function saveEnergySetup(input: {
  providerId: string;
  tariffId: string;
  monthlyBillGbp: number;
}): Promise<EnergyActionResult> {
  const providerId = input.providerId.trim();
  const tariffId = input.tariffId.trim();
  if (tariffId.length === 0) return { ok: false, error: "Pick a tariff first." };
  if (!Number.isFinite(input.monthlyBillGbp) || input.monthlyBillGbp <= 0) {
    return { ok: false, error: "Enter what you spend in a typical month." };
  }

  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  // The endpoint 404s without a property profile and conflicts when one load
  // profile already exists, so let the backend tell us which verb to use
  // rather than guessing and handling the error.
  const status = await getJson<{ hasProfile?: boolean; hasLoadProfile?: boolean }>(
    "/api/energy-profile/status",
    cookie,
  );
  if (status?.hasProfile !== true) {
    return { ok: false, error: "Set your home up first, then choose a tariff." };
  }

  const body = {
    ...(providerId.length > 0 ? { providerId } : {}),
    tariffId,
    monthlyBillPence: Math.round(input.monthlyBillGbp * 100),
  };

  try {
    const res = await fetch(`${API_URL}/api/energy-profile/load-profile`, {
      method: status.hasLoadProfile === true ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as
        | { message?: string; details?: { field?: string; message?: string }[] }
        | null;
      const fields = (err?.details ?? [])
        .map((d) => [d.field, d.message].filter(Boolean).join(": "))
        .filter((line) => line.length > 0);
      const message = err?.message ?? "Couldn't save your tariff.";
      return {
        ok: false,
        error: fields.length > 0 ? `${message} (${fields.join("; ")})` : message,
      };
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the service. Try again in a moment." };
  }
}
