import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000";

/**
 * This app is the ADMIN panel only. The better-auth server is shared with the
 * member-facing app, so it happily signs in any role — the admin-only rule has
 * to be enforced here, at the one door every sign-in from this origin passes
 * through. Members are turned away before a session cookie ever reaches them.
 */
const ADMIN_ONLY_CODE = "ADMIN_ONLY";
const ADMIN_ONLY_MESSAGE =
  "This sign-in is for EnergieBee administrators only.";

// better-auth's session cookie, with the `__Secure-` prefix in production.
const SESSION_COOKIE = /^(__Secure-)?better-auth\.session_token$/;

function adminOnly(status = 403, setCookies: string[] = []): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  for (const cookie of setCookies) headers.append("Set-Cookie", cookie);
  return new Response(
    JSON.stringify({ code: ADMIN_ONLY_CODE, message: ADMIN_ONLY_MESSAGE }),
    { status, headers },
  );
}

/**
 * The `name=value` of a session cookie the auth server just issued, or null
 * when the response doesn't start a session. Keying on the cookie rather than
 * a list of endpoints covers every way in — password, 2FA, OTP, OAuth — and any
 * the auth server adds later. An expiring write (sign-out) is not an issue.
 */
function issuedSessionCookie(setCookies: string[]): string | null {
  for (const raw of setCookies) {
    const [pair, ...attrs] = raw.split(";");
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!SESSION_COOKIE.test(name) || !value) continue;
    if (attrs.some((a) => /^\s*max-age=0\s*$/i.test(a))) continue;
    return `${name}=${value}`;
  }
  return null;
}

/**
 * Ask the auth server who owns a freshly issued session. Reads straight from
 * its store (cookie cache bypassed) so the role is authoritative. Any failure
 * counts as "not an admin" — this gate fails closed.
 */
async function isAdminSession(sessionCookie: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/api/auth/get-session?disableCookieCache=true`,
      { headers: { Cookie: sessionCookie }, cache: "no-store" },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { user?: { role?: string | null } } | null;
    return data?.user?.role === "admin";
  } catch {
    return false;
  }
}

/** Revoke a session on the auth server; returns its cookie-clearing headers. */
async function revokeSession(sessionCookie: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: API_URL,
        Cookie: sessionCookie,
      },
      body: "{}",
    });
    return res.headers.getSetCookie();
  } catch {
    return [];
  }
}

/**
 * Auth proxy: forwards all /api/auth/* requests to the backend
 * and properly forwards Set-Cookie headers back to the browser.
 */
async function proxyAuth(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Self-service sign-up belongs to the member app. Admin accounts are
  // provisioned from /admin/manage-users (`/admin/create-user`), not here.
  if (pathname.startsWith("/api/auth/sign-up")) return adminOnly();
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}${pathname}${search}`;

  // Get incoming cookies to forward
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Read body for non-GET requests
  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      // No body
    }
  }

  // Forward the request with Origin header for CSRF protection
  const res = await fetch(targetUrl, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("Content-Type") || "application/json",
      // Set Origin to backend URL for better-auth CSRF check
      "Origin": API_URL,
      ...(cookieHeader && { Cookie: cookieHeader }),
    },
    body,
  });

  // Get response body
  const responseBody = await res.text();

  // Forward Set-Cookie headers - this is crucial for auth to work.
  //
  // Built on a plain `Headers` and returned as a plain `Response` rather than a
  // NextResponse. Better Auth legitimately emits one cookie name several times
  // in a single response — /change-password expires the session cache,
  // re-writes it, and expires it again — and two of those are byte-identical
  // strings. Measured through this route, only two of the three came out the
  // far side, which reorders the survivors so a stale value lands last and
  // wins, silently resurrecting the cached session the auth server had just
  // invalidated. A plain `Headers` is known to keep all three in order, so the
  // response is assembled on one here and handed over untouched.
  const setCookies = res.headers.getSetCookie();

  // A session was just issued — let it through only if it belongs to an admin.
  // Otherwise kill it server-side and hand the browser the clearing cookies
  // instead of the session ones.
  const issued = issuedSessionCookie(setCookies);
  if (issued && !(await isAdminSession(issued))) {
    return adminOnly(403, await revokeSession(issued));
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    res.headers.get("Content-Type") || "application/json",
  );
  for (const cookie of setCookies) {
    headers.append("Set-Cookie", cookie);
  }

  return new Response(responseBody, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export const GET = proxyAuth;
export const POST = proxyAuth;
export const PUT = proxyAuth;
export const PATCH = proxyAuth;
export const DELETE = proxyAuth;
