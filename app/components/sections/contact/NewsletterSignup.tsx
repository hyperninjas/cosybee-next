"use client";

import { useState } from "react";
import { Button, Input, TextField, toast } from "@heroui/react";
import { subscribeNewsletter } from "@/app/lib/public-forms";
import { getRecaptchaToken } from "@/app/lib/recaptcha";

/**
 * Newsletter sign-up band (single opt-in). Posts to the backend via the
 * `subscribeNewsletter` server action. Protected by a honeypot field and a
 * Google reCAPTCHA v3 token (verified server-side).
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real users never fill this
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || pending) return;
    setPending(true);
    const recaptchaToken = await getRecaptchaToken("newsletter");
    const result = await subscribeNewsletter({
      email: email.trim(),
      website,
      recaptchaToken,
    });
    setPending(false);

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
        className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
      >
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
            className="h-12 w-full border border-transparent bg-white/10 px-4 text-base text-white transition-colors placeholder:text-white/50 focus-within:border-accent"
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
          isDisabled={!email.trim() || pending}
          className="h-12 bg-accent px-6 text-base font-semibold text-white transition hover:brightness-110"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
      </form>
    </div>
  );
}
