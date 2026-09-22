import "server-only";

import { cookies } from "next/headers";

/**
 * Web equivalent of mobile's `activePropertyIdProvider` + Dio interceptor
 * pair (`energiebeemobile/lib/app/di/network_providers.dart:201`).
 *
 * The mobile app holds the current active property id in a Riverpod
 * notifier and its Dio interceptor injects `X-Property-Id: <id>` on every
 * eb-auth request. Web has no equivalent client-side store because most
 * eb-auth fetches happen server-side inside Server Actions and Server
 * Components — so we mirror the pattern via a browser-scoped cookie:
 *
 *   1. `activateProperty` writes the cookie AND primes the backend's
 *      Redis marker in one call. Either alone would be enough for the
 *      common case; sending both closes a specific race — a subsequent
 *      request that arrives before Redis has been read again would
 *      otherwise resolve via `User.defaultPropertyId`, which is one step
 *      behind. See `eb-auth/src/middleware/active-property.ts` for the
 *      full resolution chain.
 *   2. Every fetcher that hits eb-auth calls {@link withPropertyHeader}
 *      to merge `X-Property-Id` into its headers. Absent cookie → no
 *      header → backend falls back to its normal resolver, matching
 *      today's behaviour for signed-in users who have never switched.
 *
 * The cookie is deliberately NOT `httpOnly`: it holds an id the user
 * already knows (they picked the property), and future client-side
 * navigation code (a switcher pill, an "add-home" flow) needs to read
 * it to keep in-flight page state consistent. It IS `SameSite=Lax` so a
 * cross-site link cannot flip the active home behind the user's back.
 *
 * Cleared on sign-out by `clearActivePropertyId` — same shape as mobile's
 * `user_session_reset.dart` invalidating `activePropertyIdProvider` on
 * logout so a re-signed-in user with a different account doesn't inherit
 * the previous user's home.
 */
export const ACTIVE_PROPERTY_COOKIE_NAME = "eb-active-property";

/**
 * Read the active property id from the cookie, if any.
 *
 * `null` when the user has never switched (fresh session), or after
 * sign-out. Callers should treat `null` as "let the backend resolve" —
 * exactly the same behaviour as if the header had never been sent, which
 * is what {@link withPropertyHeader} already does.
 */
export async function readActivePropertyId(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(ACTIVE_PROPERTY_COOKIE_NAME);
  const value = cookie?.value?.trim() ?? "";
  return value.length > 0 ? value : null;
}

/**
 * Write the active property id to a browser cookie. Callable ONLY from a
 * Server Action (or route handler) — the underlying `cookies().set` is
 * not permitted inside a Server Component render, which is a Next.js
 * runtime constraint, not a choice on our part.
 *
 * Kept short-TTL (30 days) so a stale cookie from a long-forgotten
 * session doesn't survive forever; the backend's Redis + defaultPropertyId
 * remain authoritative for any longer-lived state.
 */
export async function writeActivePropertyId(propertyId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_PROPERTY_COOKIE_NAME, propertyId, {
    // `httpOnly: false` — see the header comment. The value is an id the
    // user chose; keeping it readable by client code lets a future
    // switcher pill (Gap 6) stay in sync without a round-trip.
    httpOnly: false,
    sameSite: "lax",
    // `secure: true` in prod so the cookie doesn't fly over plain HTTP.
    // `NODE_ENV === "development"` covers `pnpm dev`; anywhere else
    // (staging, sandbox, prod) we serve over HTTPS.
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    // 30 days — long enough to survive a laptop being closed for a
    // weekend, short enough that a re-issued user id (very rare, e.g.
    // account merge) doesn't have the wrong home stuck forever.
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Remove the cookie. Called on sign-out so the next signed-in user does
 * not inherit the previous account's active-home selection. Mirrors
 * mobile's `ref.invalidate(activePropertyIdProvider)` in
 * `user_session_reset.dart`.
 */
export async function clearActivePropertyId(): Promise<void> {
  const store = await cookies();
  store.delete(ACTIVE_PROPERTY_COOKIE_NAME);
}

/**
 * Compose a headers object that carries `X-Property-Id` when the cookie
 * is set. Callers pass whatever base headers they already need (a
 * `Cookie:` forward, a `Content-Type:`, etc.) and receive a new object;
 * the input is NOT mutated so it can be reused across parallel fetches.
 *
 * Absent cookie → the input is returned unchanged (well, spread into a
 * fresh object). That preserves today's behaviour for signed-in users
 * who have never switched: the backend resolver still runs and picks
 * whatever it would have picked before this header ever existed.
 *
 * ### Retrofit pattern
 *
 * ```ts
 * const res = await fetch(`${API_URL}/api/foo`, {
 *   headers: await withPropertyHeader({ Cookie: cookieHeader }),
 *   cache: "no-store",
 * });
 * ```
 *
 * Never call this from a Server Component's render — reading cookies is
 * fine, but every eb-auth-tenanted fetch should already be inside a
 * Server Action, a Route Handler, or a server helper marked
 * `server-only`, so a mis-use surfaces as a Next.js error at import time.
 */
export async function withPropertyHeader(
  base: Record<string, string> = {},
): Promise<Record<string, string>> {
  const id = await readActivePropertyId();
  if (id === null) return { ...base };
  return { ...base, "X-Property-Id": id };
}
