"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Server Actions for "what solar and battery kit do you have?".
 *
 * The mirror of `energy-actions.ts`, for hardware rather than supply. Step 3
 * previously offered exactly one brand — Sunsynk — so the other eleven in
 * the catalog had no way in, and a GivEnergy owner could only skip. Their
 * system then didn't exist as far as we were concerned: no capacity, no
 * generation estimate, no export eligibility.
 *
 * ### Saving takes two writes, and both matter
 *
 * `POST /api/solar-confirm` stores the declaration and returns an analysis —
 * capacity, degradation, annual generation, SEG eligibility. But it does
 * **not** feed the forecast engine: after a successful confirm,
 * `profile.hardware.solar` still reads `detected: false` and
 * `/forecast/solar` answers "No solar capacity estimated for this property".
 * The two are separate stores.
 *
 * So {@link saveSolarSetup} follows it with `PATCH /profile/hardware`,
 * carrying the capacity the analysis just computed. Verified: that single
 * extra call turns the solar forecast from a 400 into a real result. Mobile
 * only ever calls the hardware endpoint from a debug screen, so it has the
 * same hole — this is the one part of the flow that isn't a port.
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

export interface SolarBrand {
  id: string;
  label: string;
  /** Range hint, e.g. "Hybrid", "Powerwall". Empty for some brands. */
  subtitle: string;
}

/** One inverter + battery product offered by a brand. */
export interface SolarCombination {
  id: string;
  label: string;
  description: string;
  inverterKw: number;
  /** null when the product is inverter-only. */
  batteryKwh: number | null;
  /** True for the free-text "Other <Brand> model" entry. */
  isCustom: boolean;
}

export interface SolarOptions {
  brands: SolarBrand[];
  /** Products keyed by brand id. */
  combinations: Record<string, SolarCombination[]>;
  panelWattages: number[];
  installYearRange: { min: number; max: number };
}

/** What the declaration is worth, computed by the backend. */
export interface SolarAnalysis {
  capacityKwp: number | null;
  inverterKw: number | null;
  batteryCapacityKwh: number | null;
  systemAgeYears: number | null;
  degradationPercent: number | null;
  estimatedAnnualGenerationKwh: number | null;
  /** Eligible for the Smart Export Guarantee — they can be paid to export. */
  segEligible: boolean;
}

export interface SolarSetup {
  brandLabel: string;
  combinationLabel: string;
  panelCount: number | null;
  panelWattage: number | null;
  installYear: number | null;
  analysis: SolarAnalysis;
}

export type SolarActionResult = { ok: true } | { ok: false; error: string };

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
 * The brand and product catalog.
 *
 * Server-driven, like mobile's — the twelve brands and their products live
 * in the backend, so adding one never needs a web release. Returns null when
 * the catalog can't be reached; the step renders an explanatory state rather
 * than an empty picker that looks like "no brands exist".
 */
export async function getSolarOptions(): Promise<SolarOptions | null> {
  const cookie = await cookieHeader();
  if (cookie === null) return null;

  const raw = await getJson<SolarOptions>("/api/solar-confirm/options", cookie);
  if (raw === null || !Array.isArray(raw.brands) || raw.brands.length === 0) {
    return null;
  }
  return raw;
}

/** The declared system, or null when none has been confirmed yet. */
export async function getSolarSetup(): Promise<SolarSetup | null> {
  const cookie = await cookieHeader();
  if (cookie === null) return null;

  // 404 is the normal answer before anything is declared, not a failure.
  const raw = await getJson<{
    profile?: {
      brandLabel?: string;
      combinationLabel?: string;
      panelCount?: number | null;
      panelWattage?: number | null;
      installYear?: number | null;
    } | null;
    analysis?: Partial<SolarAnalysis> | null;
  }>("/api/solar-confirm", cookie);

  const profile = raw?.profile;
  if (!profile || typeof profile.brandLabel !== "string") return null;

  const a = raw?.analysis ?? {};
  return {
    brandLabel: profile.brandLabel,
    combinationLabel: profile.combinationLabel ?? "",
    panelCount: profile.panelCount ?? null,
    panelWattage: profile.panelWattage ?? null,
    installYear: profile.installYear ?? null,
    analysis: {
      capacityKwp: a.capacityKwp ?? null,
      inverterKw: a.inverterKw ?? null,
      batteryCapacityKwh: a.batteryCapacityKwh ?? null,
      systemAgeYears: a.systemAgeYears ?? null,
      degradationPercent: a.degradationPercent ?? null,
      estimatedAnnualGenerationKwh: a.estimatedAnnualGenerationKwh ?? null,
      segEligible: a.segEligible === true,
    },
  };
}

// ── Write ────────────────────────────────────────────────────────────────

/**
 * Save the declared system, then tell the forecast engine about it.
 *
 * The second call is not optional — see the module note. It is also not
 * allowed to fail the whole save: the declaration is stored and useful on
 * its own, so a hardware write that errors costs the customer a forecast,
 * not their answers.
 */
export async function saveSolarSetup(input: {
  brandId: string;
  combinationId: string;
  panelCount: number;
  panelWattage: number;
  installYear: number;
}): Promise<SolarActionResult> {
  if (input.brandId.trim().length === 0 || input.combinationId.trim().length === 0) {
    return { ok: false, error: "Pick your inverter and battery first." };
  }
  if (!Number.isInteger(input.panelCount) || input.panelCount < 1) {
    return { ok: false, error: "Enter how many panels you have." };
  }

  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  let analysis: Partial<SolarAnalysis> = {};
  try {
    const res = await fetch(`${API_URL}/api/solar-confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        brandId: input.brandId.trim(),
        combinationId: input.combinationId.trim(),
        panelCount: input.panelCount,
        panelWattage: input.panelWattage,
        installYear: input.installYear,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as
        | { message?: string; details?: { field?: string; message?: string }[] }
        | null;
      const fields = (err?.details ?? [])
        .map((d) => [d.field, d.message].filter(Boolean).join(": "))
        .filter((line) => line.length > 0);
      const message = err?.message ?? "Couldn't save your solar setup.";
      return {
        ok: false,
        error: fields.length > 0 ? `${message} (${fields.join("; ")})` : message,
      };
    }
    const body = (await res.json()) as { analysis?: Partial<SolarAnalysis> };
    analysis = body.analysis ?? {};
  } catch {
    return { ok: false, error: "Couldn't reach the service. Try again in a moment." };
  }

  await syncHardware(cookie, {
    panelCount: input.panelCount,
    capacityKwp: analysis.capacityKwp ?? null,
    batteryKwh: analysis.batteryCapacityKwh ?? null,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Copy the confirmed capacity onto the energy profile's hardware record.
 *
 * Best-effort by design: the declaration is already saved by the time this
 * runs, so failing here must not report the save as failed. The cost of a
 * miss is a solar forecast that stays unavailable until the next save, not
 * lost answers.
 *
 * Capacity is clamped to the field's documented ceilings — a large array
 * would otherwise be rejected outright and lose the whole update, which is
 * worse than storing the maximum the engine can model.
 */
async function syncHardware(
  cookie: string,
  values: { panelCount: number; capacityKwp: number | null; batteryKwh: number | null },
): Promise<void> {
  const solar: Record<string, unknown> = {
    detected: true,
    estimatedPanelCount: Math.min(values.panelCount, 50),
  };
  if (values.capacityKwp !== null) {
    solar["estimatedCapacityKwp"] = Math.min(values.capacityKwp, 50);
  }

  const body: Record<string, unknown> = { solar };
  if (values.batteryKwh !== null && values.batteryKwh > 0) {
    body["battery"] = { estimatedCapacityKwh: Math.min(values.batteryKwh, 100) };
  }

  try {
    await fetch(`${API_URL}/api/energy-profile/profile/hardware`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    // Swallowed deliberately — see the doc comment.
  }
}
