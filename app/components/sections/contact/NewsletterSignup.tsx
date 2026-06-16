"use client";

import { useRef, useState } from "react";
import { Button, Input, TextField, toast } from "@heroui/react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { subscribeNewsletter } from "@/app/lib/public-forms";
import { TURNSTILE_SITE_KEY } from "@/app/lib/turnstile";

/**
 * Newsletter sign-up band (single opt-in). Posts to the backend via the
 * `subscribeNewsletter` server action. Protected by a honeypot field and a
 * Cloudflare Turnstile token (verified server-side).
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real users never fill this
  const [pending, setPending] = useState(false);
  const [token, setToken] = useState(""); // Turnstile token
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !token || pending) return;
    setPending(true);
    const result = await subscribeNewsletter({
      email: email.trim(),
      website,
      turnstileToken: token,
    });
    setPending(false);

    // The token is single-use — reset the widget to get a fresh one either way.
    turnstileRef.current?.reset();
    setToken("");

    if (result.ok) {
      toast.success("You're subscribed — thanks for joining!");
      setEmail("");
    } else {
      toast.danger(result.error);
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-5xl rounded-2xl bg-foreground px-6 py-10 text-center sm:px-10">
      <h3 className="text-xl font-extrabold text-white sm:text-2xl">
        Join our newsletter
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
        Energy tips, product updates, and the occasional good idea — straight to
        your inbox.
      </p>
      <form
        onSubmit={onSubmit}
        className="mx-auto mt-6 flex max-w-md flex-col gap-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <TextField
            aria-label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            isRequired
            className="flex-1"
          >
            <Input
              placeholder="you@example.com"
              className="h-12 w-full rounded-lg border border-transparent bg-white/10 px-4 text-base text-white transition-colors placeholder:text-white/50 focus-within:border-accent"
            />
          </TextField>

          {/* Honeypot: off-screen, not announced to AT, ignored by humans. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="sr-only"
          />

          <Button
            type="submit"
            isPending={pending}
            isDisabled={!email.trim() || !token || pending}
            className="h-12 rounded-lg bg-accent px-6 text-base font-semibold text-white transition hover:brightness-110"
          >
            {pending ? "Subscribing…" : "Subscribe"}
          </Button>
        </div>

        {/* Cloudflare Turnstile — bot detection (verified server-side). */}
        <div className="flex justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setToken}
            onExpire={() => setToken("")}
            onError={() => setToken("")}
            options={{ theme: "dark" }}
          />
        </div>
      </form>
    </div>
  );
}
