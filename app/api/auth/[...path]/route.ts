import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

  // Create response with same status and body
  const response = new NextResponse(responseBody, {
    status: res.status,
    statusText: res.statusText,
  });

  // Forward important headers
  response.headers.set("Content-Type", res.headers.get("Content-Type") || "application/json");

  // Forward Set-Cookie headers - this is crucial for auth to work
  const setCookieHeaders = res.headers.getSetCookie();
  for (const cookie of setCookieHeaders) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

export const GET = proxyAuth;
export const POST = proxyAuth;
export const PUT = proxyAuth;
export const PATCH = proxyAuth;
export const DELETE = proxyAuth;
