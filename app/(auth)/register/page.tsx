"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Envelope, Person } from "@gravity-ui/icons";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { PasswordField } from "@/app/components/ui/PasswordField";
import { TextInputField } from "@/app/components/ui/TextInputField";
import { Button, Card, toast } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { safeRedirect } from "@/app/lib/safe-redirect";
import { SocialButtons } from "../_components/SocialButtons";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // Live validation drives both the inline field errors and the submit gate.
  const pwTooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const emailValid = /.+@.+\..+/.test(email);
  const canSubmit =
    name.trim().length > 0 &&
    emailValid &&
    password.length >= 8 &&
    password === confirm;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      callbackURL: redirectTo,
    });

    if (error) {
      toast.danger(error.message || "Could not create your account.");
      setLoading(false);
      return;
    }

    // Sign-up sends a 6-digit verification OTP, and writes require a verified
    // email — so send new users to verify-email next (carrying the intended
    // destination).
    router.push(
      `/verify-email?email=${encodeURIComponent(email.trim())}&redirect=${encodeURIComponent(redirectTo)}`,
    );
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title>Create your account</Card.Title>
        <Card.Description>
          Join EnergieBee to manage your energy in one place.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <TextInputField
            name="name"
            label="Full name"
            placeholder="Jane Doe"
            autoComplete="name"
            isRequired
            autoFocus
            value={name}
            onChange={setName}
            icon={<Person className="size-4 text-muted" />}
          />
          <TextInputField
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            isRequired
            value={email}
            onChange={setEmail}
            icon={<Envelope className="size-4 text-muted" />}
          />
          <PasswordField
            name="password"
            label="Password"
            autoComplete="new-password"
            isRequired
            value={password}
            onChange={setPassword}
            description="Use at least 8 characters."
            isInvalid={pwTooShort}
            errorMessage="Password must be at least 8 characters."
          />
          <PasswordField
            name="confirm"
            label="Confirm password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            isRequired
            value={confirm}
            onChange={setConfirm}
            isInvalid={mismatch}
            errorMessage="Passwords don't match."
          />

          <Button
            type="submit"
            className="w-full"
            isPending={loading}
            isDisabled={!canSubmit}
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <SocialButtons callbackURL={redirectTo} />
      </Card.Content>
      <Card.Footer className="justify-center">
        <span className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            Sign in
          </Link>
        </span>
      </Card.Footer>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-md p-8 text-center">Loading…</Card>}>
      <RegisterForm />
    </Suspense>
  );
}
