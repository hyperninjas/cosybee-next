import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/app/lib/admin-session";

/**
 * Request guard for the admin panel (Next 16's `proxy` convention, formerly
 * `middleware`). Everything under /admin requires a valid session cookie;
 * unauthenticated requests are redirected to /admin/login. The login page
 * itself is exempt so it stays reachable.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page must stay public, or we'd redirect-loop.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  // Remember where they were headed so login can send them back.
  if (pathname !== "/admin") {
    loginUrl.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Bare /admin plus everything beneath it.
  matcher: ["/admin", "/admin/:path*"],
};
