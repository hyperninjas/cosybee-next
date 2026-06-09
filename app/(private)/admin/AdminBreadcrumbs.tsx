"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@heroui/react";

/**
 * Routing-aware breadcrumbs for the admin panel. Renders a trail back to the
 * dashboard on every sub-page (nothing on `/admin` itself). Uses HeroUI's
 * documented `href` API — the last crumb (no href) is the current page.
 */
export function AdminBreadcrumbs() {
  const pathname = usePathname();

  // Top-level dashboard has no parent to go back to.
  if (!pathname || pathname === "/admin") return null;

  return (
    <Breadcrumbs className="mb-4 sm:mb-6">
      <Breadcrumbs.Item href="/admin">Admin</Breadcrumbs.Item>
      <Breadcrumbs.Item>{currentLabel(pathname)}</Breadcrumbs.Item>
    </Breadcrumbs>
  );
}

/** Human label for the current admin route. */
function currentLabel(pathname: string): string {
  if (pathname.startsWith("/admin/manage-users")) return "Users";
  if (pathname === "/admin/posts/new") return "New post";
  if (/^\/admin\/posts\/[^/]+\/edit$/.test(pathname)) return "Edit post";
  if (/^\/admin\/posts\/[^/]+\/preview$/.test(pathname)) return "Preview post";

  // Fallback: titleize the last path segment.
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  return last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
