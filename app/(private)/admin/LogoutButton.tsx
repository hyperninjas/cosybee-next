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
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onPress={handleLogout} isDisabled={loading}>
      {loading ? "Signing out…" : "Logout"}
    </Button>
  );
}
