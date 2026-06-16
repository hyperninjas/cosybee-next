"use server";

/**
 * Server actions for the public website forms (contact + newsletter). They run
 * server-side and proxy to the eb-auth backend, so the browser never calls the
 * API cross-origin (no CORS) and the backend origin stays out of client code.
 *
 * Each action first verifies a Cloudflare Turnstile token (bot detection)
 * before touching the backend.
 */

import { headers } from "next/headers";

const API_BASE = process.env.API_URL || "http://localhost:3000";

// Falls back to Cloudflare's "always passes" TEST secret so local dev works
// with zero config; set TURNSTILE_SECRET_KEY to the real value in production.
const TURNSTILE_SECRET =
  process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type FormResult = { ok: true } | { ok: false; error: string };

/**
 * Verify a Turnstile token with Cloudflare. Returns false on a missing/invalid
 * token or any network error (fail-closed — a form submit should not slip
 * through if verification can't be completed).
 */
async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const hdrs = await headers();
    const ip =
      hdrs.get("cf-connecting-ip") ??
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

    const form = new URLSearchParams();
    form.set("secret", TURNSTILE_SECRET);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
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
  /** Cloudflare Turnstile token from the widget. */
  turnstileToken?: string;
};

export async function submitContact(input: ContactInput): Promise<FormResult> {
  if (!(await verifyTurnstile(input.turnstileToken))) {
    return { ok: false, error: VERIFY_FAILED };
  }
  // Forward only the enquiry fields — the Turnstile token stays server-side.
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
  /** Cloudflare Turnstile token from the widget. */
  turnstileToken?: string;
};

export async function subscribeNewsletter(
  input: NewsletterInput,
): Promise<FormResult> {
  if (!(await verifyTurnstile(input.turnstileToken))) {
    return { ok: false, error: VERIFY_FAILED };
  }
  return postJson("/api/newsletter/subscribe", {
    email: input.email,
    website: input.website,
  });
}
