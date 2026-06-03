import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "@/app/lib/admin-session";

/**
 * Admin authentication — a single hardcoded user for now (credentials from
 * env, with insecure dev defaults). The request guard lives in `proxy.ts`;
 * `assertAdmin()` here is defense-in-depth for Server Actions, which are
 * reachable via direct POST, not only through the gated UI.
 *
 * Replace with real users / a provider later — the surface to change is small.
 */

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@energiebee.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

/** Validate submitted credentials against the configured admin user. */
export function checkCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD
  );
}

/** Is the current request carrying a valid admin session cookie? */
export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Issue a signed, http-only session cookie for the admin user. */
export async function createSession(): Promise<void> {
  const token = await createSessionToken();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Clear the session cookie (logout). */
export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Redirect to the login page unless a valid session is present. */
export async function assertAdmin(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}
