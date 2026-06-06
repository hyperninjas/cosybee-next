"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm font-medium text-muted hover:text-danger transition-colors disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Logout"}
    </button>
  );
}
