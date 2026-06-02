import "server-only";

/**
 * Admin authorization gate.
 *
 * Per the current project decision the admin panel is unauthenticated
 * (local development only). This is intentionally the single choke
 * point every admin Server Action calls, so the panel can be locked
 * down later with a one-line change here — e.g. validate a session
 * cookie and `throw new Error("Unauthorized")` when absent.
 *
 * SECURITY NOTE: Server Actions are reachable via direct POST, not just
 * through the UI. Leaving this open in a deployed environment exposes
 * create/update/delete to anyone. Add a real check before shipping.
 */
export async function assertAdmin(): Promise<void> {
  // no-op (local dev). Implement auth here when going beyond local.
}
