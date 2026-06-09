"use client";

import { usePathname } from "next/navigation";
import { ArrowUpRightFromSquare } from "@gravity-ui/icons";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { AppAvatar } from "@/app/components/ui/AppAvatar";
import CosybeeLogo from "@/app/components/ui/CosybeeLogo";
import { LogoutButton } from "./LogoutButton";

type AdminUser = { name: string; email: string; image?: string | null };

export function AdminHeader({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const onUsers = pathname?.startsWith("/admin/manage-users") ?? false;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        {/* Brand → dashboard */}
        <Link href="/admin" className="flex items-center gap-2.5">
          <CosybeeLogo className="h-8 w-auto" />
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            energiebee <span className="text-accent">admin</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/admin/manage-users"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              onUsers
                ? "bg-background text-foreground"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            Users
          </Link>

          <span
            className="mx-1 hidden h-5 w-px bg-border sm:block"
            aria-hidden
          />

          <Link
            href="/hive"
            external
            className="hidden items-center gap-1 rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground sm:inline-flex"
          >
            View Hive
            <ArrowUpRightFromSquare className="size-3.5 opacity-70" />
          </Link>
          <Link
            href="/learn"
            external
            className="hidden items-center gap-1 rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground sm:inline-flex"
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
      </div>
    </header>
  );
}
