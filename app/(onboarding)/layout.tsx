import type { Metadata } from "next";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { requireUser } from "@/app/lib/server-session";

/**
 * Onboarding shell.
 *
 * The funnel lives in its own route group so it can render WITHOUT the
 * site navbar / footer (same pattern as `(auth)/layout.tsx`) — the user
 * has one job on each step and every extra link is a chance to bail out
 * of the funnel. Progress-bar header is rendered inside each page
 * (`OnboardingProgress`) so the step count is co-located with the step
 * markup, rather than trying to infer the current step from the URL in
 * this layout.
 *
 * Auth-gated: an unauthenticated visitor to `/onboarding/*` is bounced to
 * `/login` with a redirect back here.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The redirect target is the entry step; whichever step the user hit
  // directly, they still complete the funnel from the top after login.
  await requireUser("/onboarding/address");

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-foreground"
          >
            Energie<span className="text-accent">Bee</span>
          </Link>
          <span className="text-xs text-muted">Setting up your home</span>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
        {children}
      </div>
    </main>
  );
}
