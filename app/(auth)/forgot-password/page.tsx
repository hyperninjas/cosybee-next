"use client";

import { useState } from "react";
import { Envelope } from "@gravity-ui/icons";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { TextInputField } from "@/app/components/ui/TextInputField";
import { Button, Card, toast } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "forget-password",
    });

    if (error) {
      toast.danger(error.message || "Failed to send reset code.");
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
          <TextInputField
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            isRequired
            autoFocus
            value={email}
            onChange={setEmail}
            icon={<Envelope className="size-4 text-muted" />}
            description="We'll email you a 6-digit reset code."
          />

          <Button
            type="submit"
            className="w-full"
            isPending={loading}
            isDisabled={!/.+@.+\..+/.test(email)}
          >
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
