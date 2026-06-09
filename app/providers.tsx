"use client";

import { ThemeProvider } from "next-themes";

/**
 * App-wide client providers. next-themes is HeroUI's recommended way to switch
 * light/dark — it toggles the `class` (and `data-theme`) on <html>, persists
 * the choice to localStorage, and injects a pre-paint script so there's no
 * flash of the wrong theme (works with the cached HTML from the service
 * worker too, since the script is inline).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute={["class", "data-theme"]}
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
