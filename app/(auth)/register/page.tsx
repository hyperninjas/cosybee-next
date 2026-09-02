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
import { SocialButtons } from "@/app/(auth)/_components/SocialButtons";

/**
 * Better Auth's code for "that address already has an account". The backend
 * raises it from a before-hook on `/sign-up/email`, using the same code the
 * library itself uses for this case.
 */
const EMAIL_TAKEN_CODE = "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Default to /post-login (role-based: admins → dashboard, others → home) when
  // there's no explicit ?redirect= to honour. Carried through to verify-email
  // and used as the social `callbackURL`, so every sign-up path lands the same.
  const redirectTo = safeRedirect(params.get("redirect"), "/post-login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  // The address the backend last rejected as already registered. Stored as the
  // address rather than a boolean so editing the field clears the error on its
  // own — no second piece of state to keep in step.
  const [takenEmail, setTakenEmail] = useState<string | null>(null);

  // Live validation drives both the inline field errors and the submit gate.
  const pwTooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const emailValid = /.+@.+\..+/.test(email);
  // Compared lowercased/trimmed, matching how the backend keys accounts.
  // Inline rather than a shared helper: the React Compiler instruments
  // module-level functions in client components with `useMemoCache`, which
  // throws "Invalid hook call" the moment one is called from an event handler.
  const emailTaken =
    takenEmail !== null && email.trim().toLowerCase() === takenEmail;
  const canSubmit =
    name.trim().length > 0 &&
    emailValid &&
    !emailTaken &&
    password.length >= 8 &&
    password === confirm;

  // Where the "sign in instead" link goes, keeping whatever destination the
  // visitor was originally heading for.
  const loginHref = `/login?redirect=${encodeURIComponent(redirectTo)}`;

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
      // The backend refuses a sign-up for an address that already has an
      // account (see the `/sign-up/email` before-hook in eb-auth's
      // modules/auth/auth.ts) — nothing was created and no code was sent, so
      // point at the email field and offer sign-in rather than flashing a
      // toast that's gone before it's read.
      if (error.code === EMAIL_TAKEN_CODE) {
        setTakenEmail(email.trim().toLowerCase());
      } else {
        toast.danger(error.message || "Could not create your account.");
      }
      setLoading(false);
      return;
    }

    // Past this point the account really is new — a duplicate address is
    // rejected above, not waved through. Writes require a verified email, so
    // new users go to verify-email next (carrying the intended destination),
    // which is what requests the 6-digit OTP.
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
            isInvalid={emailTaken}
            errorMessage={
              <>
                An account already exists with this email.{" "}
                <Link href={loginHref} className="font-medium underline">
                  Sign in
                </Link>{" "}
                instead, or{" "}
                <Link href="/forgot-password" className="font-medium underline">
                  reset your password
                </Link>
                .
              </>
            }
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
