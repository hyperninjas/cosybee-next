/**
 * Cloudflare Turnstile site key — public, rendered into the browser widget.
 *
 * Falls back to Cloudflare's "always passes" TEST site key so local dev works
 * with zero config. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY (and TURNSTILE_SECRET_KEY
 * for server verification) to your real keys in staging/production.
 *
 * The widget MODE (Managed / Invisible / Non-interactive) is configured on the
 * widget in the Cloudflare dashboard, not here.
 */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

console.log(
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  TURNSTILE_SITE_KEY,
  "azad",
);
