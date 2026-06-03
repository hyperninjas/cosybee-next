/**
 * Signed admin-session token helpers — deliberately dependency-free and
 * edge-safe (Web Crypto only, no Node APIs) so the same code runs in both
 * `proxy.ts` (request guard) and server actions/components.
 *
 * The token is `<expiryMs>.<hmac>` where the HMAC covers `admin:<expiryMs>`.
 * A valid signature can only be produced with ADMIN_SESSION_SECRET, so the
 * cookie can't be forged. This is a single hardcoded admin, so there's no
 * per-user payload — swap in real users/JWT later.
 */

const SECRET =
  process.env.ADMIN_SESSION_SECRET || "insecure-dev-secret-change-me";

export const SESSION_COOKIE = "eb_admin_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toHex(signature);
}

/** Mint a signed session token valid for {@link SESSION_TTL_SECONDS}. */
export async function createSessionToken(): Promise<string> {
  const expiry = Date.now() + SESSION_TTL_SECONDS * 1000;
  const signature = await hmac(`admin:${expiry}`);
  return `${expiry}.${signature}`;
}

/** True only for an unexpired token bearing a valid signature. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;

  const expiry = Number(token.slice(0, dot));
  const signature = token.slice(dot + 1);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  const expected = await hmac(`admin:${expiry}`);
  if (signature.length !== expected.length) return false;

  // Constant-time comparison.
  let diff = 0;
  for (let i = 0; i < signature.length; i++) {
    diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
