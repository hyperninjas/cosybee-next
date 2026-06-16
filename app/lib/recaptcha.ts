"use client";

/**
 * Google reCAPTCHA v3 (invisible, score-based) — client helper.
 *
 * No React provider/widget: the script is lazy-loaded on first use and a fresh
 * token is generated per form submit via `grecaptcha.execute`. The token is
 * verified server-side in the form actions (see public-forms.ts).
 *
 * Site key is public (`NEXT_PUBLIC_*`, inlined at build). With no key set,
 * `getRecaptchaToken` resolves to "" and the server skips verification — so
 * local dev works with zero config.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined" || !RECAPTCHA_SITE_KEY) {
    return Promise.resolve();
  }
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Start loading the reCAPTCHA script ahead of time (e.g. on form mount).
 * reCAPTCHA v3 scores improve when Google can observe page interactions before
 * submit, so loading early gives it context. Fire-and-forget; no-op without a
 * site key or on the server.
 */
export function preloadRecaptcha(): void {
  void loadScript();
}

/**
 * Generate a reCAPTCHA v3 token for the given action (e.g. "contact").
 * Call this when the user submits (tokens expire after ~2 min). Returns ""
 * when no site key is configured (dev) or on any failure — the server treats
 * an empty token as "unverified".
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) return "";
  try {
    await loadScript();
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) return "";
    return await new Promise<string>((resolve) => {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action })
          .then(resolve)
          .catch(() => resolve(""));
      });
    });
  } catch {
    return "";
  }
}
