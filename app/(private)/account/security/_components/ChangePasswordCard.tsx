"use client";

import { useState } from "react";
import { Button, Card, toast } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { isFreshSessionError } from "@/app/lib/api-error";
import { ReauthNotice } from "@/app/components/account/ReauthNotice";
import { PasswordField } from "@/app/components/ui/PasswordField";

export function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [reauth, setReauth] = useState(false);

  const pwTooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit =
    current.length > 0 && next.length >= 8 && next === confirm;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setReauth(false);

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
        toast.danger(error.message || "Could not change password.");
      }
    } else {
      toast.success("Password changed. Other sessions were signed out.");
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
          <PasswordField
            name="current"
            label="Current password"
            autoComplete="current-password"
            isRequired
            value={current}
            onChange={setCurrent}
          />
          <PasswordField
            name="next"
            label="New password"
            autoComplete="new-password"
            isRequired
            value={next}
            onChange={setNext}
            description="Use at least 8 characters."
            isInvalid={pwTooShort}
            errorMessage="Password must be at least 8 characters."
          />
          <PasswordField
            name="confirm"
            label="Confirm new password"
            autoComplete="new-password"
            isRequired
            value={confirm}
            onChange={setConfirm}
            isInvalid={mismatch}
            errorMessage="Passwords don't match."
          />

          {reauth && <ReauthNotice />}

          <div>
            <Button type="submit" isPending={saving} isDisabled={!canSubmit}>
              {saving ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
