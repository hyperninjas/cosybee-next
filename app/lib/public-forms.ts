"use server";

/**
 * Server actions for the public website forms (contact + newsletter). They run
 * server-side and proxy to the eb-auth backend, so the browser never calls the
 * API cross-origin (no CORS) and the backend origin stays out of client code.
 *
 * Each action first verifies a Google reCAPTCHA v3 token (bot detection)
 * before touching the backend.
 */

import { headers } from "next/headers";

const API_BASE = process.env.API_URL || "http://localhost:3000";

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
// v3 returns a 0–1 score; below this we treat the request as a likely bot.
const RECAPTCHA_MIN_SCORE = 0.5;

export type FormResult = { ok: true } | { ok: false; error: string };

/**
 * Verify a reCAPTCHA v3 token with Google. Checks success, the score
 * threshold, and that the action matches the form. Fail-closed on a
 * missing/invalid token or network error.
 *
 * When RECAPTCHA_SECRET_KEY is unset (local dev), verification is skipped so
 * the forms work with zero config; set the secret in staging/production.
 */
async function verifyRecaptcha(
  token: string | undefined,
  expectedAction: string,
): Promise<boolean> {
  if (!RECAPTCHA_SECRET) return true; // dev: not configured → skip
  if (!token) return false;
  try {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

    const form = new URLSearchParams();
    form.set("secret", RECAPTCHA_SECRET);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);

    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
    });
    const data = (await res.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
    };
    return (
      data.success === true &&
      (data.score ?? 0) >= RECAPTCHA_MIN_SCORE &&
      data.action === expectedAction
    );
  } catch {
    return false;
  }
}

async function postJson(path: string, body: unknown): Promise<FormResult> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (res.ok) return { ok: true };

    // Surface the backend's message (validation / rate-limit / 503) when present.
    let error = "Something went wrong. Please try again.";
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) error = data.message;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    return { ok: false, error };
  } catch {
    return { ok: false, error: "Network error. Please check your connection and try again." };
  }
}

const VERIFY_FAILED =
  "Verification failed. Please refresh the page and try again.";

export type ContactInput = {
  name: string;
  email: string;
  message: string;
  phone?: string;
  company?: string;
  /** Honeypot — must stay empty. */
  website?: string;
  /** reCAPTCHA v3 token (action: "contact"). */
  recaptchaToken?: string;
};

export async function submitContact(input: ContactInput): Promise<FormResult> {
  if (!(await verifyRecaptcha(input.recaptchaToken, "contact"))) {
    return { ok: false, error: VERIFY_FAILED };
  }
  // Forward only the enquiry fields — the reCAPTCHA token stays server-side.
  return postJson("/api/contact", {
    name: input.name,
    email: input.email,
    message: input.message,
    phone: input.phone,
    company: input.company,
    website: input.website,
  });
}

export type NewsletterInput = {
  email: string;
  /** Honeypot — must stay empty. */
  website?: string;
  /** reCAPTCHA v3 token (action: "newsletter"). */
  recaptchaToken?: string;
};

export async function subscribeNewsletter(
  input: NewsletterInput,
): Promise<FormResult> {
  if (!(await verifyRecaptcha(input.recaptchaToken, "newsletter"))) {
    return { ok: false, error: VERIFY_FAILED };
  }
  return postJson("/api/newsletter/subscribe", {
    email: input.email,
    website: input.website,
  });
}
