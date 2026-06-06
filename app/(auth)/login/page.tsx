"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
  TextField,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { safeRedirect } from "@/app/lib/safe-redirect";
import { SocialButtons } from "../_components/SocialButtons";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"));
  const resetSuccess = params.get("reset") === "success";

  // "credentials" → email+password; "twofa" → the second-factor challenge that
  // better-auth requires when the account has 2FA enabled.
  const [step, setStep] = useState<"credentials" | "twofa">("credentials");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Second-factor state.
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  // When checked, better-auth drops a trusted-device cookie so this browser
  // skips the 2FA prompt on future logins (duration set server-side via
  // `trustDeviceMaxAge`).
  const [trustDevice, setTrustDevice] = useState(false);

  function finish() {
    router.push(redirectTo);
    router.refresh();
  }

  async function onCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const { data, error } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (error) {
      setError(error.message || "Invalid email or password.");
      setLoading(false);
      return;
    }

    // 2FA-enabled accounts don't get a session yet — they must clear the
    // second factor first. better-auth signals this with `twoFactorRedirect`.
    if ((data as { twoFactorRedirect?: boolean })?.twoFactorRedirect) {
      setStep("twofa");
      setLoading(false);
      return;
    }

    finish();
  }

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = useBackup
      ? await authClient.twoFactor.verifyBackupCode({
          code: backupCode.trim(),
          trustDevice,
        })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice });

    if (error) {
      setError(error.message || "That code wasn't valid. Try again.");
      setLoading(false);
      return;
    }
    finish();
  }

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title>{step === "twofa" ? "Two-factor authentication" : "Welcome back"}</Card.Title>
        <Card.Description>
          {step === "twofa"
            ? useBackup
              ? "Enter one of your backup codes."
              : "Enter the 6-digit code from your authenticator app."
            : "Sign in to your EnergieBee account."}
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {resetSuccess && step === "credentials" && (
          <Alert status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Password updated</Alert.Title>
              <Alert.Description>
                Please sign in with your new password.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {step === "credentials" ? (
          <>
            <form onSubmit={onCredentials} className="flex flex-col gap-4">
              <TextField name="email" type="email" isRequired>
                <Label>Email</Label>
                <Input placeholder="you@example.com" autoComplete="email" />
              </TextField>
              <TextField name="password" type="password" isRequired>
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input placeholder="••••••••" autoComplete="current-password" />
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
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <SocialButtons callbackURL={redirectTo} />
          </>
        ) : (
          <form onSubmit={onVerify} className="flex flex-col gap-4">
            {useBackup ? (
              <TextField
                name="backupCode"
                type="text"
                isRequired
                value={backupCode}
                onChange={setBackupCode}
              >
                <Label>Backup code</Label>
                <Input placeholder="xxxxxxxx" autoComplete="one-time-code" />
              </TextField>
            ) : (
              <div className="flex flex-col gap-2">
                <Label>Authentication code</Label>
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
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
            )}

            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Content>
              </Alert>
            )}

            <Checkbox
              isSelected={trustDevice}
              onChange={setTrustDevice}
              id="trust-device"
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label htmlFor="trust-device" className="text-sm">
                  Trust this device
                </Label>
              </Checkbox.Content>
            </Checkbox>

            <Button
              type="submit"
              className="w-full"
              isPending={loading}
              isDisabled={useBackup ? backupCode.trim().length === 0 : code.length !== 6}
            >
              {loading ? "Verifying…" : "Verify"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setUseBackup((v) => !v);
                setError("");
                setCode("");
                setBackupCode("");
              }}
              className="text-center text-sm text-muted hover:text-foreground"
            >
              {useBackup
                ? "Use your authenticator app instead"
                : "Use a backup code instead"}
            </button>
          </form>
        )}
      </Card.Content>
      {step === "credentials" && (
        <Card.Footer className="justify-center">
          <span className="text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-foreground underline">
              Create one
            </Link>
          </span>
        </Card.Footer>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-md p-8 text-center">Loading…</Card>}>
      <LoginForm />
    </Suspense>
  );
}
