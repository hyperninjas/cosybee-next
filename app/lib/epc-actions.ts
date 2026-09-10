"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import type {
  BuiltForm,
  ConstructionEra,
  GlazingType,
  HeatingType,
  HotWater,
  LoftInsulation,
  PropertyType,
  WallInsulation,
} from "./epc-field-options";

/**
 * Server Actions for the home's energy rating — reading it, and refining it
 * when it is an estimate rather than an official certificate.
 *
 * Two endpoints back this, and they answer different questions:
 *
 *   • `GET /api/energy-profile/home-summary` — the band and score to show.
 *   • `GET /api/energy-profile/profile` — whether the rating is synthetic,
 *     plus the raw answers behind it. `HomeSummary` carries no
 *     `isSyntheticEpc` field, so the "Refine" affordance cannot be driven
 *     from the summary alone; mobile hit the same wall.
 *
 * Writes go to `PATCH /api/energy-profile/profile/without-epc`, which
 * re-runs the estimator and stores a new synthetic certificate.
 *
 * ⚠️ The wizard is exposed through two endpoints with two separate
 * validation schemas — this one and `POST /api/properties/no-epc`, used at
 * signup. They must be kept in step; per the spec they have drifted twice
 * already, and each time it surfaced only as failed submissions.
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

/**
 * The answers behind a synthetic estimate — every field optional, because
 * "never answered" is a state we deliberately preserve.
 *
 * Onboarding asks one question and the estimator fills the rest from
 * era-typical values. Storing only what the resident actually chose is what
 * lets the refine flow pre-select their real answers and leave the
 * assumptions blank, so an assumption never masquerades as a choice.
 */
export interface SyntheticAnswers {
  propertyType?: PropertyType;
  builtForm?: BuiltForm;
  constructionEra?: ConstructionEra;
  wallInsulation?: WallInsulation;
  loftInsulation?: LoftInsulation;
  glazingType?: GlazingType;
  heatingType?: HeatingType;
  hotWater?: HotWater;
  hasSolar?: boolean;
  floorArea?: number;
  bedrooms?: number;
}

export interface EpcRating {
  /** SAP score, 1–100. Estimates are capped at 91 — band A is never awarded. */
  score: number | null;
  /** Band letter, A–G. */
  band: string | null;
  /** True when this is our estimate rather than a lodged certificate. */
  isSynthetic: boolean;
  /** Whether a profile exists at all. False for a home with no property yet. */
  hasProfile: boolean;
  /** Previous answers, for pre-selecting the refine flow. */
  answers: SyntheticAnswers;
}

export type EpcUpdateResult = { ok: true } | { ok: false; error: string };

// ── Read ─────────────────────────────────────────────────────────────────

async function getJson<T>(path: string, cookie: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    // 404 is a normal answer here — a user with no property yet has no
    // profile and no summary. Treat it as absence, not failure.
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Everything the rating card needs, in one call pair.
 *
 * Returns `hasProfile: false` rather than throwing when the backend has
 * nothing for this user — the card renders an empty state, and a dashboard
 * shouldn't fail to load because one tile has no data.
 */
export async function getEpcRating(): Promise<EpcRating> {
  const empty: EpcRating = {
    score: null,
    band: null,
    isSynthetic: false,
    hasProfile: false,
    answers: {},
  };

  const cookie = await cookieHeader();
  if (cookie === null) return empty;

  const [summary, profile] = await Promise.all([
    getJson<{
      currentEnergyRating?: number | null;
      currentEnergyBand?: string | null;
    }>("/api/energy-profile/home-summary", cookie),
    getJson<{
      isSyntheticEpc?: boolean;
      // Documented as a string; observed as a number on create and a
      // string after a refine. Either way it is the score, not a band.
      energyRating?: number | string | null;
      latestEpcData?: { _syntheticInput?: Record<string, unknown> } | null;
    }>("/api/energy-profile/profile", cookie),
  ]);

  if (summary === null && profile === null) return empty;

  return {
    // `home-summary` is the only source of a band letter. The profile's
    // `energyRating` is NOT one despite the name — it is the SAP score, and
    // it arrives as a number on create and a string after a refine, so it
    // is parsed rather than trusted. Using it as a band fallback would put
    // "32" where a letter belongs.
    score: summary?.currentEnergyRating ?? parseScore(profile?.energyRating),
    band: summary?.currentEnergyBand ?? null,
    isSynthetic: profile?.isSyntheticEpc === true,
    hasProfile: profile !== null,
    answers: readAnswers(profile?.latestEpcData?._syntheticInput),
  };
}

/** The SAP score as a number, accepting the string form the API also returns. */
function parseScore(raw: number | string | null | undefined): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const value = Number(raw.trim());
  return Number.isFinite(value) ? value : null;
}

/**
 * Pull the stored wizard answers out of the synthetic certificate blob.
 *
 * `_syntheticInput` is where the estimator keeps the raw answers, and it is
 * how mobile pre-fills its refine screen.
 *
 * ⚠️ VERIFIED ABSENT on this backend: `GET /api/energy-profile/profile`
 * returns no `latestEpcData` at all, so today this always yields `{}` and
 * the refine flow starts blank every time. Mobile reads it from somewhere
 * that still has it; the web needs the field added to this response before
 * pre-selection can work. Kept wired so it starts working the moment the
 * backend exposes it, and degrades to "answer from scratch" until then.
 *
 * Values are passed through unvalidated but narrowly typed. A stored value
 * the current option list no longer offers simply won't match any radio,
 * which renders as unanswered rather than as a broken control.
 */
function readAnswers(raw: Record<string, unknown> | undefined): SyntheticAnswers {
  if (!raw || typeof raw !== "object") return {};
  const out: SyntheticAnswers = {};
  const str = (k: string): string | undefined =>
    typeof raw[k] === "string" && raw[k].length > 0 ? raw[k] : undefined;
  const num = (k: string): number | undefined =>
    typeof raw[k] === "number" && Number.isFinite(raw[k]) ? raw[k] : undefined;

  const propertyType = str("propertyType") as PropertyType | undefined;
  const builtForm = str("builtForm") as BuiltForm | undefined;
  const constructionEra = str("constructionEra") as ConstructionEra | undefined;
  const wallInsulation = str("wallInsulation") as WallInsulation | undefined;
  const loftInsulation = str("loftInsulation") as LoftInsulation | undefined;
  const glazingType = str("glazingType") as GlazingType | undefined;
  const heatingType = str("heatingType") as HeatingType | undefined;
  const hotWater = str("hotWater") as HotWater | undefined;
  const floorArea = num("floorArea");
  const bedrooms = num("bedrooms");

  if (propertyType) out.propertyType = propertyType;
  if (builtForm) out.builtForm = builtForm;
  if (constructionEra) out.constructionEra = constructionEra;
  if (wallInsulation) out.wallInsulation = wallInsulation;
  if (loftInsulation) out.loftInsulation = loftInsulation;
  if (glazingType) out.glazingType = glazingType;
  if (heatingType) out.heatingType = heatingType;
  if (hotWater) out.hotWater = hotWater;
  if (typeof raw["hasSolar"] === "boolean") out.hasSolar = raw["hasSolar"];
  if (floorArea !== undefined) out.floorArea = floorArea;
  if (bedrooms !== undefined) out.bedrooms = bedrooms;
  return out;
}

// ── Write ────────────────────────────────────────────────────────────────

/**
 * Save refined answers and re-run the estimate.
 *
 * Sends **only what the resident answered**. Filling the gaps here would
 * make an assumption indistinguishable from a choice — both in the score
 * and in whether the flow can tell a question has ever been answered. The
 * estimator supplies era-typical values for anything omitted.
 */
export async function updateSyntheticProfile(
  answers: SyntheticAnswers,
): Promise<EpcUpdateResult> {
  const cookie = await cookieHeader();
  if (cookie === null) return { ok: false, error: "You need to sign in first." };

  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (value !== undefined && value !== null) body[key] = value;
  }
  if (Object.keys(body).length === 0) {
    return { ok: false, error: "Nothing to save yet." };
  }

  try {
    const res = await fetch(`${API_URL}/api/energy-profile/profile/without-epc`, {
      method: "PATCH",
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
      const message = err?.message ?? "Couldn't save your answers.";
      return {
        ok: false,
        error: fields.length > 0 ? `${message} (${fields.join("; ")})` : message,
      };
    }
    // The rating card reads from this page's server render, so the new
    // estimate only reaches the user once the dashboard re-renders.
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the service. Try again in a moment." };
  }
}
