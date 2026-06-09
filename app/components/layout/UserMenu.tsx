"use client";

import { AppLink as Link } from "@/app/components/ui/AppLink";
import { useRouter } from "next/navigation";
import { Dropdown, Label, Separator, buttonVariants } from "@heroui/react";
import { AppAvatar } from "@/app/components/ui/AppAvatar";
import { authClient } from "@/app/lib/auth-client";

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
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Navbar is dark, so the ghost button is re-tinted white; Sign up
            uses the primary (accent) variant as-is. */}
        <Link
          href="/login"
          className={`${buttonVariants({
            variant: "ghost",
            size: "sm",
          })} text-white hover:bg-white/10`}
        >
          Log in
        </Link>
        <Link
          href="/register"
          className={buttonVariants({ variant: "primary", size: "sm" })}
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
        <AppAvatar
          src={user.image}
          name={user.name || user.email}
          alt={user.name || "Account"}
          size="sm"
        />
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
