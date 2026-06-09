"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Envelope } from "@gravity-ui/icons";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { PasswordField } from "@/app/components/ui/PasswordField";
import { TextInputField } from "@/app/components/ui/TextInputField";
import {
  Button,
  Card,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
  toast,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const pwTooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const emailValid = /.+@.+\..+/.test(email);
  const canSubmit =
    emailValid &&
    otp.length === 6 &&
    password.length >= 8 &&
    password === confirm;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });

    if (error) {
      toast.danger(error.message || "Failed to reset password.");
      setLoading(false);
      return;
    }
    router.push("/login?reset=success");
  }

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title>Reset password</Card.Title>
        <Card.Description>
          Enter the code we emailed you and choose a new password.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-2">
            <Label>6-digit code</Label>
            <InputOTP variant="secondary"
              maxLength={6}
              value={otp}
              onChange={setOtp}
              pattern={REGEXP_ONLY_DIGITS}
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
              </InputOTP.Group>
              <InputOTP.Separator />
              <InputOTP.Group>
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
          </div>

          <PasswordField
            name="password"
            label="New password"
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
            label="Confirm new password"
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
            {loading ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </Card.Content>
      <Card.Footer className="justify-center">
        <Link href="/login" className="text-sm text-muted">
          Back to sign in
        </Link>
      </Card.Footer>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-md p-8 text-center">Loading…</Card>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
