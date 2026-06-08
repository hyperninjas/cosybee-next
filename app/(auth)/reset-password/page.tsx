"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import {
  Alert,
  Button,
  Card,
  Input,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
  TextField,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });

    if (error) {
      setError(error.message || "Failed to reset password.");
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
          <TextField name="email" type="email" isRequired>
            <Label>Email</Label>
            <Input variant="secondary"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </TextField>

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

          <TextField name="password" type="password" isRequired>
            <Label>New password</Label>
            <Input variant="secondary"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </TextField>
          <TextField name="confirm" type="password" isRequired>
            <Label>Confirm new password</Label>
            <Input variant="secondary"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </TextField>

          {error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{error}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          <Button type="submit" className="w-full" isPending={loading}>
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
