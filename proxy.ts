import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeRedirect } from "@/app/lib/safe-redirect";

/**
 * Optimistic auth gate (Next.js 16 "Proxy", formerly Middleware).
 *
 * This only inspects the *presence* of a better-auth session cookie — it never
 * validates the session or checks roles (that would mean a network/DB call on
 * every prefetch). Secure identity/role checks live in the Data Access Layer
 * (`app/lib/server-session.ts`) and run inside the protected layouts and
 * Server Actions. See the Next.js auth guide: optimistic here, secure there.
 */

// Areas that require *some* authenticated session.
const protectedPrefixes = ["/admin", "/account"];

// Public auth screens — a logged-in user shouldn't see these.
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

function hasSessionCookie(request: NextRequest): boolean {
  // In production the cookie is prefixed with `__Secure-`.
  return Boolean(
    request.cookies.get("__Secure-better-auth.session_token")?.value ||
      request.cookies.get("better-auth.session_token")?.value,
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSessionCookie(request);

  // Already signed in → bounce away from login/register/etc.
  if (
    authRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  ) {
    if (authed) {
      // Honour an explicit, on-site ?redirect=; otherwise hand off to
      // /post-login, which routes admins to the dashboard and everyone else
      // home. Never default an authed user to /account.
      const target = safeRedirect(
        request.nextUrl.searchParams.get("redirect"),
        "/post-login",
      );
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // Protected areas → require a session cookie, else send to login with a
  // sanitised return path.
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!authed) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
