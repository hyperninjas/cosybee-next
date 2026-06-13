"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

/**
 * Post-login landing. Resolves the destination from the session role so
 * credential and social sign-in share one decision: admins → dashboard,
 * everyone else → home (banned → /banned, no session → /login). The actual
 * access control still lives server-side in the /admin and /account layouts —
 * this only routes. It renders a full loading screen until the redirect lands,
 * so the user never sees a bare page while the session resolves.
 */
export default function PostLoginPage() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return; // wait for the session to resolve
    const user = data?.user;
    if (!user) {
      router.replace("/login");
    } else if (user.banned) {
      router.replace("/banned");
    } else {
      router.replace(user.role === "admin" ? "/admin" : "/");
    }
  }, [isPending, data, router]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4">
      <Spinner size="lg" aria-label="Signing you in…" />
      <p className="text-sm text-muted">Signing you in…</p>
    </main>
  );
}
