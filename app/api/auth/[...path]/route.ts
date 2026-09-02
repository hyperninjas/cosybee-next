import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000";

/**
 * Auth proxy: forwards all /api/auth/* requests to the backend
 * and properly forwards Set-Cookie headers back to the browser.
 */
async function proxyAuth(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
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
  const headers = new Headers();
  headers.set(
    "Content-Type",
    res.headers.get("Content-Type") || "application/json",
  );
  for (const cookie of res.headers.getSetCookie()) {
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
