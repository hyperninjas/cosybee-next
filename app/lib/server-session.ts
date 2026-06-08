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

/** Require any authenticated user. Redirects to login when absent. */
export async function requireUser(redirectTo?: string): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) {
    redirect(
      redirectTo
        ? `/login?redirect=${encodeURIComponent(redirectTo)}`
        : "/login",
    );
  }
  if (session.user.banned) redirect("/banned");
  return session;
}

/**
 * Require an admin-role user. Non-admins are sent home; unauthenticated users
 * to login. This is the secure backstop behind the optimistic `proxy.ts` gate.
 */
export async function requireAdmin(): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/admin");
  if (session.user.banned) redirect("/banned");
  if (session.user.role !== "admin") redirect("/");
  return session;
}
