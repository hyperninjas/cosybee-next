import type { Metadata } from "next";
import { AdminHeader } from "./AdminHeader";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { requireAdmin } from "@/app/lib/server-session";

// Keep the admin panel out of search results.
export const metadata: Metadata = {
  title: "Admin — energiebee",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Secure role gate for the whole panel. The optimistic cookie check in
  // proxy.ts only confirms *a* session exists; this confirms it's an admin
  // (validated against the external auth server) — non-admins are sent home,
  // unauthenticated users to login.
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <AdminBreadcrumbs />
        {children}
      </main>
    </div>
  );
}
