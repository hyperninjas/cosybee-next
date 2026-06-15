"use server";

/**
 * Server actions for the public website forms (contact + newsletter). They run
 * server-side and proxy to the eb-auth backend, so the browser never calls the
 * API cross-origin (no CORS) and the backend origin stays out of client code.
 */

const API_BASE = process.env.API_URL || "http://localhost:3000";

export type FormResult = { ok: true } | { ok: false; error: string };

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

export type ContactInput = {
  name: string;
  email: string;
  message: string;
  phone?: string;
  company?: string;
  /** Honeypot — must stay empty. */
  website?: string;
};

export async function submitContact(input: ContactInput): Promise<FormResult> {
  return postJson("/api/contact", input);
}

export type NewsletterInput = {
  email: string;
  /** Honeypot — must stay empty. */
  website?: string;
};

export async function subscribeNewsletter(input: NewsletterInput): Promise<FormResult> {
  return postJson("/api/newsletter/subscribe", input);
}
