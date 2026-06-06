import "server-only";

import { getServerSession } from "@/app/lib/server-session";

/**
 * Admin authorization gate — the single choke point every admin Server Action
 * calls. Server Actions are reachable via direct POST (not just through the
 * UI), so this enforces the admin role on the server against the external
 * better-auth session. Throws on failure, which aborts the action.
 *
 * Page/layout navigation uses `requireAdmin()` (redirect-based) instead; this
 * `throw`-based variant is the correct shape for mutations.
 */
export async function assertAdmin(): Promise<void> {
  const session = await getServerSession();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}
