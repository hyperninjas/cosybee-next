"use client";

import { useRouter, usePathname } from "next/navigation";
import { Dropdown, Label, Separator } from "@heroui/react";

/** Simple external link icon */
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/** Caret for the Posts dropdown trigger. */
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
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
  const onAuthors = pathname?.startsWith("/admin/authors") ?? false;
  const onCategories = pathname?.startsWith("/admin/categories") ?? false;
  const onTags = pathname?.startsWith("/admin/tags") ?? false;
  const onTariffs = pathname?.startsWith("/admin/tariffs") ?? false;
  const onMedia = pathname?.startsWith("/admin/media") ?? false;

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
      <div className="mx-auto flex h-16 max-w-360 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand → dashboard */}
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <CosybeeLogo className="h-8 w-auto shrink-0" />
          <span className="truncate text-base font-extrabold tracking-tight text-foreground sm:text-lg">
            energiebee <span className="text-accent">admin</span>
          </span>
        </Link>

        {/* Desktop nav (md+) — real anchors styled with HeroUI's button
            variants so their radius/size match the Sign out Button. */}
        <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
          {/* Under 1200px the post-taxonomy links collapse into a single
              "Posts" dropdown to save horizontal space; at ≥1200px they show
              as separate links. */}
          <div className="min-[1200px]:hidden">
            <Dropdown>
              <Dropdown.Trigger
                aria-label="Posts menu"
                // Dropdown.Trigger IS the button; re-assert inline-flex centering
                // (its base class is inline-block) — same recipe as RowActions.
                className={`${buttonVariants({
                  variant:
                    onAuthors || onCategories || onTags ? "secondary" : "ghost",
                  size: "sm",
                })} inline-flex items-center justify-center gap-1`}
              >
                Posts
                <ChevronDownIcon className="size-3.5 opacity-70" />
              </Dropdown.Trigger>
              <Dropdown.Popover className="min-w-40">
                <Dropdown.Menu onAction={(key) => onMenuAction(String(key))}>
                  <Dropdown.Item id="/admin/authors" textValue="Authors">
                    <Label>Authors</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="/admin/categories" textValue="Categories">
                    <Label>Categories</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="/admin/tags" textValue="Tags">
                    <Label>Tags</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>

          <div className="hidden items-center gap-1 min-[1200px]:flex">
            <Link
              href="/admin/authors"
              className={buttonVariants({
                variant: onAuthors ? "secondary" : "ghost",
                size: "sm",
              })}
            >
              Authors
            </Link>
            <Link
              href="/admin/categories"
              className={buttonVariants({
                variant: onCategories ? "secondary" : "ghost",
                size: "sm",
              })}
            >
              Categories
            </Link>
            <Link
              href="/admin/tags"
              className={buttonVariants({
                variant: onTags ? "secondary" : "ghost",
                size: "sm",
              })}
            >
              Tags
            </Link>
          </div>
          <Link
            href="/admin/tariffs"
            className={buttonVariants({
              variant: onTariffs ? "secondary" : "ghost",
              size: "sm",
            })}
          >
            Tariffs
          </Link>
          <Link
            href="/admin/media"
            className={buttonVariants({
              variant: onMedia ? "secondary" : "ghost",
              size: "sm",
            })}
          >
            Media
          </Link>
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
            <ExternalLinkIcon className="size-3.5 opacity-70" />
          </Link>
          <Link
            href="/learn"
            external
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View Learn
            <ExternalLinkIcon className="size-3.5 opacity-70" />
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
        <div className="lg:hidden">
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
                <Dropdown.Item id="/admin/authors" textValue="Authors">
                  <Label>Authors</Label>
                </Dropdown.Item>
                <Dropdown.Item id="/admin/categories" textValue="Categories">
                  <Label>Categories</Label>
                </Dropdown.Item>
                <Dropdown.Item id="/admin/tags" textValue="Tags">
                  <Label>Tags</Label>
                </Dropdown.Item>
                <Dropdown.Item id="/admin/tariffs" textValue="Tariffs">
                  <Label>Tariffs</Label>
                </Dropdown.Item>
                <Dropdown.Item id="/admin/media" textValue="Media">
                  <Label>Media</Label>
                </Dropdown.Item>
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
                <Dropdown.Item
                  id="signout"
                  textValue="Sign out"
                  variant="danger"
                >
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
