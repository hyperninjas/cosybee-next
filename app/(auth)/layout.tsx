import type { Metadata } from "next";
import Link from "next/link";

// Auth screens shouldn't be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared shell for the public auth flow (login / register / forgot / reset).
 * Renders inside the root layout (so the site Navbar + Footer remain), and
 * simply centres the auth card with the brand wordmark above it.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-2xl font-extrabold tracking-tight text-foreground"
      >
        Energie<span className="text-accent">Bee</span>
      </Link>
      {children}
    </main>
  );
}
