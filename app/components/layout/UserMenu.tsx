"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Dropdown, Label, Separator } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

function initialsFrom(name?: string | null, email?: string | null): string {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Navbar auth control. Shows Log in / Sign up when signed out, and an avatar
 * dropdown (Profile · Security · Admin* · Sign out) when signed in. Reads the
 * live session from better-auth so it updates without a full reload.
 */
export function UserMenu() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  if (isPending) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-surface/10" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-muted transition-colors hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  async function onAction(key: string) {
    if (key === "signout") {
      await authClient.signOut();
      router.push("/");
      router.refresh();
      return;
    }
    router.push(key);
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Account menu"
        className="rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <Avatar size="sm">
          {user.image ? (
            <Avatar.Image src={user.image} alt={user.name || "Account"} />
          ) : null}
          <Avatar.Fallback>{initialsFrom(user.name, user.email)}</Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-56">
        <div className="border-b border-border px-3 py-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name || "Account"}
          </p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <Dropdown.Menu onAction={(key) => onAction(String(key))}>
          <Dropdown.Item id="/account/profile" textValue="Profile">
            <Label>Profile</Label>
          </Dropdown.Item>
          <Dropdown.Item id="/account/security" textValue="Security">
            <Label>Security</Label>
          </Dropdown.Item>
          {isAdmin && (
            <Dropdown.Item id="/admin" textValue="Admin dashboard">
              <Label>Admin dashboard</Label>
            </Dropdown.Item>
          )}
          <Separator />
          <Dropdown.Item id="signout" textValue="Sign out" variant="danger">
            <Label>Sign out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
