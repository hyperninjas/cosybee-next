import "server-only";

import { cookies } from "next/headers";
import type { DailyCost, TariffInfo } from "@/app/components/sections/energyflow-home";

/**
 * Live tariff + daily-cost assembly from eb-auth's Octopus endpoints.
 *
 * The dashboard exposes two right-column cards that need tariff-level
 * numbers: current import/export/standing (TariffCard) and today's £
 * breakdown (DailyCostCard). Both live behind three eb-auth calls:
 *
 *   GET /api/octopus/connection
 *       → the linked account: importTariffCode, exportTariffCode,
 *         gspLetter, accountNumber.
 *   GET /api/tariffs/{code}?regionId={n}
 *       → catalog row: friendly name, standing charges, rate periods.
 *   GET /api/octopus/consumption?from&to&direction=import|export
 *       → half-hourly readings for a window.
 *
 * A dedicated cost endpoint doesn't exist; we compute £ on our side from
 * consumption × unit rate + standing. That keeps a change to tariff
 * rounding, VAT handling or Agile weighting on this file rather than
 * pulling backend changes for a display tweak.
 *
 * Approximation note: for Agile tariffs the per-half-hour price varies,
 * so `importGbp = totalImportKwh × currentImportPence` under-/over-counts
 * on days with wide price swings. First pass is deliberately simple; the
 * next step is to fetch the 48 agile slots and weight each reading.
 */

const API_URL = process.env.API_URL || "http://localhost:4000";

/**
 * Octopus's own public API. No auth required, published product data —
 * the same endpoints eb-auth's ingest script hits. We call it directly
 * as a fallback for tariffs the eb-auth catalog hasn't ingested yet
 * (e.g. brand-new Intelligent Octopus Go product versions). This is
 * a first-pass short-cut; the durable fix is to trigger an ingest for
 * every customer tariff on connect, then this file only reads from
 * eb-auth.
 */
const OCTOPUS_PUBLIC_API = "https://api.octopus.energy/v1";

// ── Cookie helper ───────────────────────────────────────────────────────

async function cookieHeader(): Promise<string | null> {
  const store = await cookies();
  const header = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return header.length > 0 ? header : null;
}

async function fetchJson<T>(path: string, cookie: string): Promise<T | null> {
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

// ── GSP letter → regionId (10–23) ───────────────────────────────────────

/**
 * Octopus assigns each UK meter a GSP letter (A–P, no I/O) tied to its
 * Grid Supply Point. eb-auth stores it on the connection row and
 * indexes tariff rates by `regionId`. Same table lives on the backend
 * (`octopus.regions.ts`) — kept in sync here as a small const-map
 * because a round-trip to look it up would trade a network hop for
 * a build-time lookup we can already do inline.
 */
const GSP_TO_REGION: Record<string, number> = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16,
  H: 20, J: 19, K: 21, L: 22, M: 23, N: 18, P: 17,
};

function regionIdFromGsp(gspLetter: string | null): number | null {
  if (!gspLetter) return null;
  return GSP_TO_REGION[gspLetter.toUpperCase()] ?? null;
}

// ── Backend response shapes we consume ──────────────────────────────────

interface OctopusConnectionResponse {
  connected: boolean;
  accountNumber?: string;
  importTariffCode?: string | null;
  exportTariffCode?: string | null;
  gspLetter?: string | null;
  backfillComplete?: boolean;
}

interface ConsumptionResponse {
  totalKwh: number;
  count: number;
}

// ── Octopus public-API fallback ─────────────────────────────────────────

interface OctopusRateResult {
  results: Array<{
    value_inc_vat: number;
    valid_from: string;
    valid_to?: string | null;
  }>;
}

/**
 * Parse `E-1R-INTELLI-FIX-12M-26-06-13-G` → `INTELLI-FIX-12M-26-06-13`.
 *
 *   E   → fuel code (electricity)
 *   1R  → register count
 *   ...  → the product code (variable segments)
 *   G   → GSP letter
 *
 * eb-auth's parser does the same thing; kept inline here (rather than
 * proxied through eb-auth) so a full-tariff fetch doesn't need three
 * round-trips.
 */
function extractProductCode(tariffCode: string): string | null {
  const parts = tariffCode.split("-");
  if (parts.length < 4) return null;
  // Drop leading fuel + register + trailing GSP.
  return parts.slice(2, -1).join("-");
}

/**
 * Pick the rate whose valid-window covers `now`. Octopus returns rates
 * sorted newest-first, and each rate has `valid_from` and optionally
 * `valid_to` (open-ended means "still current"). A single-rate fixed
 * tariff returns one row with no `valid_to` and matches immediately.
 */
function pickCurrentRate(
  results: OctopusRateResult["results"],
  now: number,
): number | null {
  for (const r of results) {
    const from = new Date(r.valid_from).getTime();
    if (Number.isNaN(from) || from > now) continue;
    if (r.valid_to) {
      const to = new Date(r.valid_to).getTime();
      if (!Number.isNaN(to) && to <= now) continue;
    }
    return r.value_inc_vat;
  }
  return null;
}

async function fetchOctopusPublicRate(
  productCode: string,
  tariffCode: string,
  kind: "standard-unit-rates" | "standing-charges",
): Promise<number | null> {
  try {
    const res = await fetch(
      `${OCTOPUS_PUBLIC_API}/products/${productCode}/electricity-tariffs/${tariffCode}/${kind}/?page_size=48`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as OctopusRateResult;
    return pickCurrentRate(body.results, Date.now());
  } catch {
    return null;
  }
}

// ── Live tariff assembly ────────────────────────────────────────────────

/**
 * Combine connection info + tariff detail + Agile current price into the
 * TariffInfo shape the card consumes. Returns null when we can't reach
 * eb-auth or the account has no linked tariff codes yet.
 */
export async function fetchLiveTariff(): Promise<{
  tariff: TariffInfo | null;
  connection: OctopusConnectionResponse | null;
  regionId: number | null;
}> {
  const cookie = await cookieHeader();
  if (cookie === null) return { tariff: null, connection: null, regionId: null };

  const connection = await fetchJson<OctopusConnectionResponse>(
    "/api/octopus/connection",
    cookie,
  );
  if (!connection?.connected) {
    return { tariff: null, connection, regionId: null };
  }

  const regionId = regionIdFromGsp(connection.gspLetter ?? null);
  const importCode = connection.importTariffCode ?? null;
  if (!importCode || regionId === null) {
    return { tariff: null, connection, regionId };
  }

  // Rate resolution runs three fetches in parallel — Octopus's public
  // API is used for the current-window import + standing rate (works
  // for any tariff, no eb-auth ingest needed), and eb-auth's Agile
  // current-slot endpoint for export (Agile Outgoing is what most
  // export-metered customers are on, and eb-auth already resolves it).
  const importProductCode = extractProductCode(importCode);
  const exportCode = connection.exportTariffCode ?? null;
  const exportProductCode = exportCode ? extractProductCode(exportCode) : null;

  const [importPence, standingPence, exportPence] = await Promise.all([
    importProductCode
      ? fetchOctopusPublicRate(importProductCode, importCode, "standard-unit-rates")
      : Promise.resolve(null),
    importProductCode
      ? fetchOctopusPublicRate(importProductCode, importCode, "standing-charges")
      : Promise.resolve(null),
    exportProductCode && exportCode
      ? fetchOctopusPublicRate(exportProductCode, exportCode, "standard-unit-rates")
      : Promise.resolve(null),
  ]);

  // Friendly name comes from the eb-auth catalog (indexed by UUID, so we
  // need to search by name substring — brittle but the only path today).
  // Falls back to the tariff code when the catalog lookup fails.
  const friendlyName = await fetchFriendlyName(importCode, cookie);

  const tariff: TariffInfo = {
    name: friendlyName ?? importCode,
    importPence: importPence ?? 0,
    exportPence: exportPence ?? 0,
    standingPence: standingPence ?? 0,
  };

  return { tariff, connection, regionId };
}

/**
 * Best-effort friendly-name lookup for an Octopus tariff code. The
 * eb-auth catalog only exposes `GET /api/tariffs/:id` by UUID; the only
 * way to translate a product code into that UUID today is a substring
 * search on `?q=` — brittle, so we take the first result and fall back
 * to the raw code when the search returns nothing.
 */
async function fetchFriendlyName(
  tariffCode: string,
  cookie: string,
): Promise<string | null> {
  const product = extractProductCode(tariffCode);
  if (!product) return null;
  // Sub-segments of the product code make the best search token
  // (e.g. "INTELLI-FIX" finds "Intelligent Octopus Go 12M Fixed …").
  const searchTerm = product.split("-").slice(0, 2).join(" ");
  const res = await fetchJson<{ data: Array<{ name: string }> }>(
    `/api/tariffs?q=${encodeURIComponent(searchTerm)}&limit=3`,
    cookie,
  );
  return res?.data?.[0]?.name ?? null;
}

// ── Live daily cost assembly ────────────────────────────────────────────

/**
 * UTC midnight → UTC midnight window for the day at `offsetDays` from
 * today. Simplification for the first pass: Europe/London is UTC+0 in
 * winter and UTC+1 in summer, so a UTC-midnight window can slice a real
 * billing day by up to one hour. Good enough for a running-total display
 * card; when we switch to the eb-auth cost-impact engine (which handles
 * TZ correctly) this helper goes away entirely.
 */
function dayWindowIso(offsetDays: number): { from: string; to: string } {
  const now = new Date();
  const startUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays),
  );
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { from: startUtc.toISOString(), to: endUtc.toISOString() };
}

async function fetchDayTotal(
  cookie: string,
  offsetDays: number,
  direction: "import" | "export",
): Promise<number> {
  const { from, to } = dayWindowIso(offsetDays);
  const res = await fetchJson<ConsumptionResponse>(
    `/api/octopus/consumption?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&direction=${direction}`,
    cookie,
  );
  return res?.totalKwh ?? 0;
}

/**
 * Compute today's + yesterday's £ breakdown from consumption × tariff.
 * Returns null when the tariff data is missing — the card falls back to
 * its demo values so the layout doesn't collapse.
 *
 * Rounded to two decimals for display; the underlying computation uses
 * plain floats. Rounding once at the boundary is standard for GBP shown
 * on a UI card; every "billing-accurate" penny lives on eb-auth's
 * cost-impact engine, which we'll switch to when it exposes a HTTP
 * endpoint.
 */
export async function fetchLiveDailyCost(
  tariff: TariffInfo | null,
): Promise<DailyCost | null> {
  if (!tariff) return null;
  const cookie = await cookieHeader();
  if (cookie === null) return null;

  const [importKwhToday, exportKwhToday, importKwhYesterday, exportKwhYesterday] =
    await Promise.all([
      fetchDayTotal(cookie, 0, "import"),
      fetchDayTotal(cookie, 0, "export"),
      fetchDayTotal(cookie, -1, "import"),
      fetchDayTotal(cookie, -1, "export"),
    ]);

  const compute = (importKwh: number, exportKwh: number): {
    net: number;
    importGbp: number;
    standingGbp: number;
    exportCreditGbp: number;
  } => {
    const importGbp = (importKwh * tariff.importPence) / 100;
    const standingGbp = tariff.standingPence / 100;
    const exportCreditGbp = (exportKwh * tariff.exportPence) / 100;
    const net = importGbp + standingGbp - exportCreditGbp;
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      net: round(net),
      importGbp: round(importGbp),
      standingGbp: round(standingGbp),
      exportCreditGbp: round(exportCreditGbp),
    };
  };

  const today = compute(importKwhToday, exportKwhToday);
  const yesterday = compute(importKwhYesterday, exportKwhYesterday);

  return {
    netGbp: today.net,
    prevNetGbp: yesterday.net,
    importGbp: today.importGbp,
    standingGbp: today.standingGbp,
    exportCreditGbp: today.exportCreditGbp,
  };
}
