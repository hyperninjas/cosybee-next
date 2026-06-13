"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await authClient.signOut();
      // There is no /admin/login route — the login page lives at /login.
      // Refresh so any cached server UI drops the now-signed-out session.
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setLoading(false);
    }
  }

  return (
    // HeroUI Button has no `warning` variant, so we use the warning color token
    // on a ghost button for the cautionary look.
    <Button
      variant="ghost"
      size="sm"
      className="text-warning hover:text-warning"
      onPress={handleLogout}
      isDisabled={loading}
    >
      {loading ? "Signing out…" : "Logout"}
    </Button>
  );
}
