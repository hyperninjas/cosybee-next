"use client";

import { AppLink as Link } from "@/app/components/ui/AppLink";
import { LogoutButton } from "./LogoutButton";

export function AdminHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/admin" className="text-lg font-extrabold">
          energiebee <span className="text-accent">admin</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/admin/manage-users" className="text-muted hover:text-foreground">
            Users
          </Link>
          <Link href="/hive" className="text-muted hover:text-foreground">
            View Hive
          </Link>
          <Link href="/learn" className="text-muted hover:text-foreground">
            View Learn
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
