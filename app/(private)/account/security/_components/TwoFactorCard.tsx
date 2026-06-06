"use client";

import { useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  Alert,
  Button,
  Card,
  Chip,
  Input,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
  TextField,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

type Mode = "view" | "enable-password" | "enable-verify" | "disable";

export function TwoFactorCard({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [mode, setMode] = useState<Mode>("view");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setMode("view");
    setPassword("");
    setCode("");
    setQr(null);
    setBackupCodes([]);
    setError("");
    setBusy(false);
  }

  // Step 1 of enabling: verify password, get the TOTP URI + backup codes, then
  // render the QR locally (the secret never leaves the browser).
  async function startEnable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const { data, error } = await authClient.twoFactor.enable({ password });
    if (error || !data) {
      setError(error?.message || "Could not start two-factor setup.");
      setBusy(false);
      return;
    }

    try {
      const qrDataUrl = await QRCode.toDataURL(data.totpURI, { width: 220, margin: 1 });
      setQr(qrDataUrl);
    } catch {
      // QR failed to render — the verify step still works via manual entry.
      setQr(null);
    }
    setBackupCodes(data.backupCodes ?? []);
    setMode("enable-verify");
    setBusy(false);
  }

  // Step 2 of enabling: confirm a code from the authenticator app.
  async function confirmEnable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    if (error) {
      setError(error.message || "That code wasn't valid. Try again.");
      setBusy(false);
      return;
    }
    setEnabled(true);
    setMode("view");
    setPassword("");
    setCode("");
    setQr(null);
    setBusy(false);
  }

  async function disable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await authClient.twoFactor.disable({ password });
    if (error) {
      setError(error.message || "Could not disable two-factor.");
      setBusy(false);
      return;
    }
    setEnabled(false);
    reset();
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-3">
          <Card.Title>Two-factor authentication</Card.Title>
          <Chip size="sm" color={enabled ? "success" : "default"} variant="soft">
            {enabled ? "On" : "Off"}
          </Chip>
        </div>
        <Card.Description>
          Add a one-time code from an authenticator app when you sign in.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {error && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error}</Alert.Title>
            </Alert.Content>
          </Alert>
        )}

        {/* Idle view */}
        {mode === "view" && (
          <div>
            {enabled ? (
              <Button variant="danger-soft" onPress={() => setMode("disable")}>
                Disable two-factor
              </Button>
            ) : (
              <Button onPress={() => setMode("enable-password")}>
                Enable two-factor
              </Button>
            )}
          </div>
        )}

        {/* Enable — step 1: password */}
        {mode === "enable-password" && (
          <form onSubmit={startEnable} className="flex max-w-md flex-col gap-4">
            <TextField
              name="password"
              type="password"
              isRequired
              value={password}
              onChange={setPassword}
            >
              <Label>Confirm your password</Label>
              <Input autoComplete="current-password" />
            </TextField>
            <div className="flex gap-2">
              <Button type="submit" isPending={busy}>
                Continue
              </Button>
              <Button type="button" variant="tertiary" onPress={reset}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Enable — step 2: scan + verify */}
        {mode === "enable-verify" && (
          <form onSubmit={confirmEnable} className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Scan this QR code with your authenticator app, then enter the
              6-digit code it shows.
            </p>
            {qr && (
              <Image
                src={qr}
                alt="Two-factor QR code"
                width={220}
                height={220}
                unoptimized
                className="rounded-lg border border-border"
              />
            )}

            {backupCodes.length > 0 && (
              <div className="rounded-lg border border-warning bg-warning-soft p-4">
                <p className="text-sm font-semibold text-warning-soft-foreground">
                  Save your backup codes
                </p>
                <p className="mb-2 text-xs text-warning-soft-foreground">
                  Store these somewhere safe — each can be used once if you lose
                  your device.
                </p>
                <div className="grid grid-cols-2 gap-1 font-mono text-sm text-warning-soft-foreground">
                  {backupCodes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Verification code</Label>
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

            <div className="flex gap-2">
              <Button type="submit" isPending={busy} isDisabled={code.length !== 6}>
                Verify & enable
              </Button>
              <Button type="button" variant="tertiary" onPress={reset}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Disable — confirm password */}
        {mode === "disable" && (
          <form onSubmit={disable} className="flex max-w-md flex-col gap-4">
            <TextField
              name="password"
              type="password"
              isRequired
              value={password}
              onChange={setPassword}
            >
              <Label>Confirm your password to disable</Label>
              <Input autoComplete="current-password" />
            </TextField>
            <div className="flex gap-2">
              <Button type="submit" variant="danger" isPending={busy}>
                Disable two-factor
              </Button>
              <Button type="button" variant="tertiary" onPress={reset}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card.Content>
    </Card>
  );
}
