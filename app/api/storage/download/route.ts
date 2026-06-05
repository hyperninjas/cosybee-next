import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ message: "Missing key parameter" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(
      `${API_URL}/api/storage/download?key=${encodeURIComponent(key)}`,
      {
        method: "GET",
        headers: {
          ...(cookieHeader && { Cookie: cookieHeader }),
        },
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[storage/download] Proxy error:", error);
    return NextResponse.json(
      { message: "Failed to get download URL" },
      { status: 500 }
    );
  }
}
