import type { Metadata } from "next";
import { requireUser } from "@/app/lib/server-session";

/**
 * Onboarding shell.
 *
 * The site Navbar is rendered by the root layout — this shell just wraps
 * the funnel content in a centred column so the step markup lines up
 * with the app's usual page width. Progress-bar header is rendered
 * inside each page (`OnboardingProgress`) so the step count is
 * co-located with the step markup, rather than inferred from the URL
 * here.
 *
 * ### Access
 *
 *   • Not signed in → `/login?redirect=/onboarding/address`.
 *   • Signed in → allowed. Individual pages (address, building-profile)
 *     add the "already has property → send to dashboard" gate because
 *     steps 3 (sunsync) and 4 (octopus) run AFTER the property is
 *     created and would otherwise be blocked by a blanket layout gate.
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
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
        {children}
      </div>
    </main>
  );
}
