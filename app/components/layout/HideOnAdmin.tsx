"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the global marketing chrome (site Navbar / Footer) on shells that
 * render their own top bar. Currently just `/admin` — the admin console
 * has its own header and account menu, and the marketing navbar would
 * duplicate them.
 *
 * Named `HideOnAdmin` for historical reasons: `/onboarding` used to hide
 * the site chrome too (its layout rendered a minimal branded header of
 * its own), but the funnel now uses the same site navbar as the rest of
 * the app so the header is consistent everywhere a signed-in user goes.
 * Renaming would ripple through every layout import; not worth it.
 */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
