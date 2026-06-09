"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowUpRightFromSquare } from "@gravity-ui/icons";
import { Dropdown, Label, Separator } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { AppAvatar } from "@/app/components/ui/AppAvatar";
import CosybeeLogo from "@/app/components/ui/CosybeeLogo";
import { authClient } from "@/app/lib/auth-client";
import { LogoutButton } from "./LogoutButton";

type AdminUser = { name: string; email: string; image?: string | null };

export function AdminHeader({ user }: { user: AdminUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const onUsers = pathname?.startsWith("/admin/manage-users") ?? false;

  // Drives the mobile dropdown: internal nav, external (new-tab) links, sign out.
  async function onMenuAction(key: string) {
    if (key === "signout") {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
      return;
    }
    if (key.startsWith("ext:")) {
      window.open(key.slice(4), "_blank", "noopener,noreferrer");
      return;
    }
    router.push(key);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand → dashboard */}
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <CosybeeLogo className="h-8 w-auto shrink-0" />
          <span className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-lg">
            energiebee <span className="text-accent">admin</span>
          </span>
        </Link>

        {/* Desktop nav (md+) — real anchors styled with HeroUI's button
            variants so their radius/size match the Sign out Button. */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <Link
            href="/admin/manage-users"
            className={buttonVariants({
              variant: onUsers ? "secondary" : "ghost",
              size: "sm",
            })}
          >
            Users
          </Link>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <Link
            href="/hive"
            external
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View Hive
            <ArrowUpRightFromSquare className="size-3.5 opacity-70" />
          </Link>
          <Link
            href="/learn"
            external
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View Learn
            <ArrowUpRightFromSquare className="size-3.5 opacity-70" />
          </Link>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <div className="flex items-center gap-2.5 pl-1">
            <AppAvatar
              name={user.name}
              src={user.image}
              size="sm"
              color="accent"
              variant="soft"
            />
            <LogoutButton />
          </div>
        </nav>

        {/* Mobile menu (< md): avatar opens a dropdown with the same actions */}
        <div className="md:hidden">
          <Dropdown>
            <Dropdown.Trigger
              aria-label="Admin menu"
              className="rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <AppAvatar
                name={user.name}
                src={user.image}
                alt={user.name}
                size="sm"
                color="accent"
                variant="soft"
              />
            </Dropdown.Trigger>
            <Dropdown.Popover className="min-w-56">
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <Dropdown.Menu onAction={(key) => onMenuAction(String(key))}>
                <Dropdown.Item id="/admin/manage-users" textValue="Users">
                  <Label>Users</Label>
                </Dropdown.Item>
                <Dropdown.Item id="ext:/hive" textValue="View Hive">
                  <Label>View Hive</Label>
                </Dropdown.Item>
                <Dropdown.Item id="ext:/learn" textValue="View Learn">
                  <Label>View Learn</Label>
                </Dropdown.Item>
                <Separator />
                <Dropdown.Item id="signout" textValue="Sign out" variant="danger">
                  <Label>Sign out</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
