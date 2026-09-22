import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { withPropertyHeader } from "./active-property-header";

/**
 * Server-side helper that answers "which providers has this user linked?".
 *
 * Both eb-auth endpoints require the same session cookie that
 * {@link ../../lib/server-session.ts | server-session.ts} forwards, so this
 * module mirrors that pattern: read the incoming cookies, forward them,
 * memoise the result with `cache()` so a layout + page + action running in
 * the same render only hits the backend once.
 *
 * Return shape stays close to what the eb-auth responses actually carry so
 * the calling page can decide the tier (0/1/2/3) *and* surface secondary
 * state — e.g. "connected but back-fill still running" for Octopus, or
 * "connected but last sync errored" for SunSync — without a second fetch.
 */

const API_URL = process.env.API_URL || "http://localhost:4000";

/** Subset of eb-auth's SunsynkConnectionStatus we actually consume. */
export interface SunSyncConnectionStatus {
  connected: boolean;
  plantId: string | null;
  inverterSerial: string | null;
  status: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  /**
   * True when the inverter's latest reading is inside the flow endpoint's
   * 20-min freshness window — i.e. the diagram will show measured watts,
   * not the modelled fallback. Distinct from `connected` (OAuth link) and
   * `lastSyncedAt` (sync job success) because both of those can be green
   * while the physical inverter is offline.
   */
  liveReporting: boolean;
  /** ISO timestamp of the newest reading, or null if none exist yet. */
  latestReadingAt: string | null;
}

/** Subset of eb-auth's OctopusConnectionStatus we actually consume. */
export interface OctopusConnectionStatus {
  connected: boolean;
  accountNumber: string | null;
  importTariffCode: string | null;
  exportTariffCode: string | null;
  hasExportMeter: boolean;
  backfillComplete: boolean;
  status: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface ConnectionState {
  sunsync: SunSyncConnectionStatus;
  octopus: OctopusConnectionStatus;
}

/**
 * The `not connected` shape both providers fall back to when the endpoint
 * returns 401 / 404 / can't be reached. Prevents the whole page from
 * crashing on a transient backend blip — the user just sees Tier 0.
 */
const DISCONNECTED_SUNSYNC: SunSyncConnectionStatus = {
  connected: false,
  plantId: null,
  inverterSerial: null,
  status: null,
  lastSyncedAt: null,
  lastError: null,
  liveReporting: false,
  latestReadingAt: null,
};

const DISCONNECTED_OCTOPUS: OctopusConnectionStatus = {
  connected: false,
  accountNumber: null,
  importTariffCode: null,
  exportTariffCode: null,
  hasExportMeter: false,
  backfillComplete: false,
  status: null,
  lastSyncedAt: null,
  lastError: null,
};

/**
 * Serialises the request cookies into a single `Cookie:` header the way
 * fetch() expects it. Same shape server-session.ts uses — kept inline
 * rather than exported from there because that file is the auth choke
 * point and this concern (relaying cookies to any eb-auth endpoint) is
 * broader than auth alone.
 */
async function forwardCookieHeader(): Promise<string | null> {
  const cookieStore = await cookies();
  const header = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return header.length > 0 ? header : null;
}

async function fetchSunSyncStatus(
  cookieHeader: string,
): Promise<SunSyncConnectionStatus> {
  try {
    const res = await fetch(`${API_URL}/api/sunsynk/connection`, {
      // `withPropertyHeader` adds `X-Property-Id` when the active-home
      // cookie is set. Without it the backend still resolves via Redis /
      // defaultPropertyId, so this is defence-in-depth for the switch
      // race, not a new requirement — the endpoint has always worked
      // without the header.
      headers: await withPropertyHeader({ Cookie: cookieHeader }),
      cache: "no-store",
    });
    if (!res.ok) return DISCONNECTED_SUNSYNC;
    const data = (await res.json()) as Partial<SunSyncConnectionStatus>;
    return {
      connected: data.connected ?? false,
      plantId: data.plantId ?? null,
      inverterSerial: data.inverterSerial ?? null,
      status: data.status ?? null,
      lastSyncedAt: data.lastSyncedAt ?? null,
      lastError: data.lastError ?? null,
      // Default to `false` when the field is absent so an old backend during
      // a rolling deploy fails safe: no confident "Live" chip, just the same
      // subtitle we always showed.
      liveReporting: data.liveReporting ?? false,
      latestReadingAt: data.latestReadingAt ?? null,
    };
  } catch {
    return DISCONNECTED_SUNSYNC;
  }
}

async function fetchOctopusStatus(
  cookieHeader: string,
): Promise<OctopusConnectionStatus> {
  try {
    const res = await fetch(`${API_URL}/api/octopus/connection`, {
      headers: await withPropertyHeader({ Cookie: cookieHeader }),
      cache: "no-store",
    });
    if (!res.ok) return DISCONNECTED_OCTOPUS;
    const data = (await res.json()) as Partial<OctopusConnectionStatus>;
    return {
      connected: data.connected ?? false,
      accountNumber: data.accountNumber ?? null,
      importTariffCode: data.importTariffCode ?? null,
      exportTariffCode: data.exportTariffCode ?? null,
      hasExportMeter: data.hasExportMeter ?? false,
      backfillComplete: data.backfillComplete ?? false,
      status: data.status ?? null,
      lastSyncedAt: data.lastSyncedAt ?? null,
      lastError: data.lastError ?? null,
    };
  } catch {
    return DISCONNECTED_OCTOPUS;
  }
}

/**
 * Fetch both connection statuses in parallel. Uses `cache()` so a page
 * that reads it in the layout and again in a component gets one round
 * trip per provider per render.
 */
export const getConnectionState = cache(async (): Promise<ConnectionState> => {
  const cookieHeader = await forwardCookieHeader();
  if (cookieHeader === null) {
    return { sunsync: DISCONNECTED_SUNSYNC, octopus: DISCONNECTED_OCTOPUS };
  }
  const [sunsync, octopus] = await Promise.all([
    fetchSunSyncStatus(cookieHeader),
    fetchOctopusStatus(cookieHeader),
  ]);
  return { sunsync, octopus };
});
