"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import {
  Alert,
  Button,
  Card,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
} from "@heroui/react";
import { authClient, useSession } from "@/app/lib/auth-client";
import { safeRedirect } from "@/app/lib/safe-redirect";

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data } = useSession();
  const redirectTo = safeRedirect(params.get("redirect"));
  const email = params.get("email") ?? data?.user?.email ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const hasSentInitial = useRef(false);

  // Automatically send OTP when page loads (if email is available)
  useEffect(() => {
    if (!email || hasSentInitial.current) return;
    hasSentInitial.current = true;

    authClient.emailOtp
      .sendVerificationOtp({ email, type: "email-verification" })
      .then(({ error }) => {
        if (error) {
          setError(error.message || "Couldn't send verification code.");
        }
      });
  }, [email]);

  async function onVerify(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
    if (error) {
      setError(error.message || "That code wasn't valid. Try again.");
      setVerifying(false);
      return;
    }
    // Refresh past the session cookie cache so `emailVerified` updates now.
    await authClient.getSession({ query: { disableCookieCache: true } });
    router.push(redirectTo);
    router.refresh();
  }

  async function resend() {
    setError("");
    setNotice("");
    setResending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setNotice(error ? "" : "A new code is on its way.");
    if (error) setError(error.message || "Couldn't resend the code.");
    setResending(false);
  }

  return (
    <Card className="w-full max-w-md">
      <Card.Header>
        <Card.Title>Verify your email</Card.Title>
        <Card.Description>
          We sent a 6-digit code to <strong>{email || "your email"}</strong>.
          Enter it to finish setting up your account.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <form onSubmit={onVerify} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Verification code</Label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              pattern={REGEXP_ONLY_DIGITS}
              variant="secondary"
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

          {notice && (
            <Alert status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{notice}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}
          {error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{error}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            isPending={verifying}
            isDisabled={otp.length !== 6}
          >
            {verifying ? "Verifying…" : "Verify email"}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-1 text-sm text-muted">
          Didn&apos;t get it?
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            isPending={resending}
            onPress={resend}
          >
            Resend code
          </Button>
        </div>
      </Card.Content>
      <Card.Footer className="justify-center">
        <Link href="/login" className="text-sm text-muted">
          Back to sign in
        </Link>
      </Card.Footer>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md p-8 text-center">Loading…</Card>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
