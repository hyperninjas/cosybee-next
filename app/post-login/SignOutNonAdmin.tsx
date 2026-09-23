"use client";

import { useEffect } from "react";
import { Spinner } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

/**
 * Ends a non-admin session and sends them to /login with an explanation.
 * Signs out BEFORE navigating: /login bounces anyone still holding a session
 * cookie straight back to /post-login, which would loop. A full navigation
 * (not router.replace) so no cached server UI outlives the session.
 */
export function SignOutNonAdmin() {
  useEffect(() => {
    authClient.signOut().finally(() => {
      window.location.replace("/login?error=admin-only");
    });
  }, []);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4">
      <Spinner size="lg" aria-label="Signing you out…" />
      <p className="text-sm text-muted">Signing you out…</p>
    </main>
  );
}
