"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { safeRedirect } from "@/app/lib/safe-redirect";
import { SocialButtons } from "../_components/SocialButtons";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"));

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: redirectTo,
    });

    if (error) {
      setError(error.message || "Could not create your account.");
      setLoading(false);
      return;
    }

    // Depending on the backend's email-verification policy the user may or may
    // not be signed in immediately. Either way, send them onward; protected
    // areas re-check on the server.
    router.push(redirectTo);
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
          <TextField name="name" type="text" isRequired>
            <Label>Full name</Label>
            <Input placeholder="Jane Doe" autoComplete="name" />
          </TextField>
          <TextField name="email" type="email" isRequired>
            <Label>Email</Label>
            <Input placeholder="you@example.com" autoComplete="email" />
          </TextField>
          <TextField name="password" type="password" isRequired>
            <Label>Password</Label>
            <Input placeholder="At least 8 characters" autoComplete="new-password" />
          </TextField>
          <TextField name="confirm" type="password" isRequired>
            <Label>Confirm password</Label>
            <Input placeholder="Re-enter your password" autoComplete="new-password" />
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
