/**
 * Tiny client-side analytics helper. Every call is a no-op unless GA4 has
 * actually loaded (production + NEXT_PUBLIC_GA_MEASUREMENT_ID set + the gtag
 * snippet present), so it's always safe to call from event handlers without
 * guarding at the call site.
 *
 * Conversions: mark these event names as "key events" in the GA4 admin to turn
 * them into conversions. We currently emit:
 *   - `generate_lead`  → contact form submitted
 *   - `sign_up`        → newsletter subscribed
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}
