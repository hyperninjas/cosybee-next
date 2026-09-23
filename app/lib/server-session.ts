import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side session Data Access Layer (DAL).
 *
 * better-auth runs on an EXTERNAL server (`API_URL`), so this app has no local
 * `auth` instance — server-side session/role checks must ask the auth server
 * directly. This module is the single secure choke point for that: it forwards
 * the incoming request cookies to `${API_URL}/api/auth/get-session` and returns
 * the validated session (including the user's `role`).
 *
 * Per the Next.js auth guidance, `proxy.ts` only does *optimistic* cookie-
 * presence checks; the *secure* role/identity checks happen here and are
 * invoked from protected layouts and every privileged Server Action.
 */

const API_URL = process.env.API_URL || "http://localhost:4000";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  /** Provided by the better-auth admin plugin. */
  role?: string | null;
  banned?: boolean | null;
  /**
   * Set by the auth server when an admin created this account with a password
   * they chose. True means the user must replace it before using the app —
   * see `requireUser` / `requireAdmin` below. Always false/absent for
   * self-service sign-ups and OAuth users.
   */
  mustChangePassword?: boolean | null;
  twoFactorEnabled?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  id: string;
  token?: string;
  userId: string;
  expiresAt: string;
}

export interface ServerSession {
  user: SessionUser;
  session: SessionInfo;
}

/**
 * Validate and return the current session, or `null` when unauthenticated.
 * Memoised with React `cache()` so multiple calls within one render pass
 * (layout + page + actions) hit the auth server only once.
 */
export const getServerSession = cache(async (): Promise<ServerSession | null> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // No cookies at all → definitely no session; skip the network round-trip.
  if (!cookieHeader) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ServerSession | null;
    if (!data?.user) return null;
    return data;
  } catch {
    // Auth server unreachable → treat as unauthenticated rather than crash.
    return null;
  }
});

/**
 * Where a user carrying `mustChangePassword` is sent. The page itself checks
 * the session directly rather than through these helpers — otherwise the gate
 * would redirect the very page meant to clear it, in a loop.
 */
const FORCED_PASSWORD_ROUTE = "/set-password";

/**
 * Where a signed-in non-admin is sent. This app is the admin panel only, so a
 * member session has no business here — /post-login signs it out and lands
 * them on /login with an explanation. (Members get their own app.)
 */
const NON_ADMIN_ROUTE = "/post-login";

/**
 * Require a signed-in user of this app — which, since the panel is admin-only,
 * means an admin. Kept as its own helper for the /account area so the login
 * redirect can carry the intended path.
 */
export async function requireUser(redirectTo?: string): Promise<ServerSession> {
  return requireAdmin(redirectTo);
}

/**
 * Require an admin-role user. Non-admins are signed out via /post-login;
 * unauthenticated users go to login. This is the secure backstop behind the
 * optimistic `proxy.ts` gate and the sign-in check in the /api/auth proxy.
 */
export async function requireAdmin(
  redirectTo = "/admin",
): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  if (session.user.banned) redirect("/banned");
  if (session.user.role !== "admin") redirect(NON_ADMIN_ROUTE);
  if (session.user.mustChangePassword) redirect(FORCED_PASSWORD_ROUTE);
  return session;
}
