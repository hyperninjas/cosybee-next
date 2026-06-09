"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the global marketing chrome (site Navbar / Footer) on the admin
 * console, which renders its own standalone top bar. Wraps server children and
 * simply omits them when the path is under `/admin`.
 */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
