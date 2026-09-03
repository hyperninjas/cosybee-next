import { Inter } from "next/font/google";

/**
 * Fonts shared by more than one module. A family used by a single page or
 * layout is declared in that file instead (Manrope in app/layout.tsx, the
 * three families in the rating-estimate document) — this file exists because
 * Inter has two consumers that must not drift apart.
 *
 * Self-hosted through next/font: the font files are emitted as static assets
 * and served from our own domain, so the browser never reaches out to
 * fonts.googleapis.com / fonts.gstatic.com. No <link rel="preconnect"> or
 * stylesheet tag is needed — Next injects the @font-face rules and preloads
 * the files, and only on the routes that actually import this module.
 */

/**
 * Article typography. Bound to a CSS variable rather than used through
 * `inter.className`, because one rule in globals.css has to reach both the
 * published article and the editor that writes it. That variable is defined
 * only on the elements carrying this class — not on :root, where Manrope's
 * lives — which is why globals.css consumes it directly in `font-family`
 * instead of through a :root token (the note on the rule explains what breaks
 * otherwise). Reference var(--font-inter), never a bare "Inter": the variable
 * resolves to `"Inter", "Inter Fallback"`, and that second name is a local
 * face next/font generates with Inter's metrics (ascent/descent/size-adjust)
 * so the swap from fallback to webfont does not reflow the article.
 *
 * - `style` ships the real italic face: article prose sets blockquotes and
 *   <em> in italics, and a synthesised oblique of Inter reads noticeably
 *   worse than the drawn one.
 * - No `weight`, so this is the variable font: every weight 100..900 out of one
 *   file, which is what the type scale in globals.css leans on. Two files ship
 *   and preload — latin roman (47 KB) and latin italic (50 KB); the other
 *   subsets are declared with a unicode-range and only fetched if a character
 *   needs them.
 * - Inter's optical-size axis (`opsz`, which Google's default embed URL asks
 *   for) is deliberately NOT requested: it costs 24 KB on each of those two
 *   preloaded files for a spacing refinement that is barely visible at our
 *   sizes. Add `axes: ["opsz"]` here if that trade ever looks worth it.
 */
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});
