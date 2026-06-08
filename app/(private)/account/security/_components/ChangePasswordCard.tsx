"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { isFreshSessionError } from "@/app/lib/api-error";
import { ReauthNotice } from "@/app/components/account/ReauthNotice";

export function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [reauth, setReauth] = useState(false);
  const [status, setStatus] = useState<
    { kind: "ok" | "error"; message: string } | null
  >(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setReauth(false);

    if (next.length < 8) {
      setStatus({ kind: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (next !== confirm) {
      setStatus({ kind: "error", message: "New passwords do not match." });
      return;
    }

    setSaving(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });

    if (error) {
      if (isFreshSessionError(error)) {
        setReauth(true);
      } else {
        setStatus({ kind: "error", message: error.message || "Could not change password." });
      }
    } else {
      setStatus({
        kind: "ok",
        message: "Password changed. Other sessions were signed out.",
      });
      setCurrent("");
      setNext("");
      setConfirm("");
    }
    setSaving(false);
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Password</Card.Title>
        <Card.Description>
          Change the password you use to sign in.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
          <TextField
            name="current"
            type="password"
            isRequired
            value={current}
            onChange={setCurrent}
          >
            <Label>Current password</Label>
            <Input variant="secondary" autoComplete="current-password" />
          </TextField>
          <TextField
            name="next"
            type="password"
            isRequired
            value={next}
            onChange={setNext}
          >
            <Label>New password</Label>
            <Input variant="secondary" autoComplete="new-password" placeholder="At least 8 characters" />
          </TextField>
          <TextField
            name="confirm"
            type="password"
            isRequired
            value={confirm}
            onChange={setConfirm}
          >
            <Label>Confirm new password</Label>
            <Input variant="secondary" autoComplete="new-password" />
          </TextField>

          {reauth && <ReauthNotice />}
          {status && (
            <Alert status={status.kind === "ok" ? "success" : "danger"}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{status.message}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          <div>
            <Button type="submit" isPending={saving}>
              {saving ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
