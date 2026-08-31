/**
 * Same-origin proxy for the AFD Postcode Evolution typeahead. Forwards the
 * browser's cookies (session identity) to the backend and passes through
 * `q`, `country`, `sessionId`. Kept behind the same-origin route so
 * `API_URL` stays server-only and the browser never sees it.
 *
 * Rate-limiting / caching / country validation all live on the backend —
 * this handler adds nothing on top.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = process.env["API_URL"] ?? "http://localhost:4000";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const sessionId = url.searchParams.get("sessionId") ?? "";
  const country = url.searchParams.get("country") ?? "GBR";
  // Guard: an empty q is a client bug (the input debouncer should never
  // fire on an empty string), but if it does happen, don't burn an AFD
  // lookup on it — return empty suggestions.
  if (q.length < 3) return NextResponse.json({ suggestions: [] });

  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const upstream = new URL(`${API_URL}/api/address/search`);
  upstream.searchParams.set("q", q);
  upstream.searchParams.set("country", country);
  upstream.searchParams.set("sessionId", sessionId);

  try {
    const res = await fetch(upstream.toString(), {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ suggestions: [] }, { status: res.status });
    }
    const body = await res.json();
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 502 });
  }
}
