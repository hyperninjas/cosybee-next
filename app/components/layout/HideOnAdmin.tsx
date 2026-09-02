"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the global marketing chrome (site Navbar / Footer) on shells that
 * render their own top bar:
 *   • `/admin`      — admin console has its own header
 *   • `/onboarding` — the funnel shell in `(onboarding)/layout.tsx`
 *                      renders a minimal branded header with progress bar
 *                      and no nav links, so the site navbar would be a
 *                      double header and offer bail-out links out of the
 *                      funnel.
 *
 * Named `HideOnAdmin` for historical reasons — the second use case landed
 * later. Renaming would ripple through every layout import; not worth it.
 */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/onboarding")) return null;
  return <>{children}</>;
}
