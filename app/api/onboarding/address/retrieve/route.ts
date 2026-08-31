/**
 * Same-origin proxy for AFD address retrieval — given a `key` returned by
 * the search endpoint, resolve the full address (uprn, coords, street,
 * postcode). Kept behind a proxy so `API_URL` stays server-only.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = process.env["API_URL"] ?? "http://localhost:4000";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const sessionId = url.searchParams.get("sessionId") ?? "";
  const country = url.searchParams.get("country") ?? "GBR";
  if (key.length === 0) {
    return NextResponse.json({ address: null }, { status: 400 });
  }

  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const upstream = new URL(`${API_URL}/api/address/retrieve`);
  upstream.searchParams.set("key", key);
  upstream.searchParams.set("country", country);
  upstream.searchParams.set("sessionId", sessionId);

  try {
    const res = await fetch(upstream.toString(), {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ address: null }, { status: res.status });
    const body = await res.json();
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ address: null }, { status: 502 });
  }
}
