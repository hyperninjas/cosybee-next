"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@heroui/react";
import { ArrowRightFromSquare } from "@gravity-ui/icons";
import { authClient } from "@/app/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setLoading(false);
    }
  }

  return (
    <Button
      variant="tertiary"
      size="sm"
      isPending={loading}
      onPress={handleLogout}
    >
      <ArrowRightFromSquare className="size-4" />
      Sign out
    </Button>
  );
}
