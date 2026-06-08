import type { Metadata } from "next";
import { requireUser } from "@/app/lib/server-session";
import { AccountNav } from "./AccountNav";
import { VerifyEmailBanner } from "@/app/components/account/VerifyEmailBanner";

// Member area — not for search engines.
export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Secure gate for the whole member area (backs up the optimistic proxy check).
  const { user } = await requireUser("/account");

  return (
    <main className="min-h-[70vh] bg-background px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">Account</h1>
          <p className="text-sm text-muted">
            {user.name} · {user.email}
          </p>
        </header>
        <AccountNav />
        <div className="mt-6 flex flex-col gap-6">
          <VerifyEmailBanner />
          {children}
        </div>
      </div>
    </main>
  );
}
