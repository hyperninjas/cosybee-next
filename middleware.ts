import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public admin routes that don't require authentication
const publicAdminRoutes = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public admin routes
  if (publicAdminRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protect all other /admin routes
  if (pathname.startsWith("/admin")) {
    // Check for Better Auth session cookie
    // In production with secure cookies, the name is prefixed with __Secure-
    const sessionCookie =
      request.cookies.get("__Secure-better-auth.session_token") ||
      request.cookies.get("better-auth.session_token");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
