"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "forget-password",
    });

    if (error) {
      setError(error.message || "Failed to send reset code.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Check your email</Card.Title>
          <Card.Description>
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 5
            minutes.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="flex flex-col gap-3">
          <Button
            className="w-full"
            // Carry the email forward so the reset form is pre-filled.
            onPress={() => {
              window.location.href = `/reset-password?email=${encodeURIComponent(email)}`;
            }}
          >
            Enter code
          </Button>
          <Link href="/login" className="text-center text-sm text-muted">
            Back to sign in
          </Link>
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title>Forgot password</Card.Title>
        <Card.Description>
          Enter your email and we&apos;ll send you a reset code.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <TextField name="email" type="email" isRequired>
            <Label>Email</Label>
            <Input
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Sending…" : "Send reset code"}
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
