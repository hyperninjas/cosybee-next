"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, toast } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { isFreshSessionError } from "@/app/lib/api-error";
import { ReauthNotice } from "@/app/components/account/ReauthNotice";
import { PasswordField } from "@/app/components/ui/PasswordField";

/**
 * The forced-change form. Same shape as the account-settings
 * ChangePasswordCard, with two differences that matter here:
 *
 *  - `revokeOtherSessions` signs out everywhere else. The old password went
 *    out by email, so any session opened with it is suspect.
 *  - `destination` is resolved on the server and navigated to directly. Going
 *    via /post-login instead would hand the decision to the client session
 *    store, which still holds the pre-change user for a moment after this
 *    request — it would send the user back here, and this page would send them
 *    on again.
 *
 * The staleness itself is handled server-side: the auth server expires the
 * cached-session cookie on the same response that clears the flag, so the next
 * read — this navigation's server render included — sees the updated row.
 */
export function SetPasswordForm({
  email,
  destination,
}: {
  email: string;
  destination: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [reauth, setReauth] = useState(false);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && confirm !== next;
  const reused = next.length > 0 && next === current;
  const canSubmit =
    current.length > 0 && next.length >= 8 && next === confirm && !reused;

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
      if (isFreshSessionError(error)) setReauth(true);
      else toast.danger(error.message || "Could not set your password.");
      setSaving(false);
      return;
    }

    toast.success("Password updated. You're all set.");
    router.replace(destination);
    // Drop the client router cache too, so nothing renders from an RSC payload
    // produced while the account was still flagged.
    router.refresh();
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>New password</Card.Title>
        <Card.Description>Signing in as {email}.</Card.Description>
      </Card.Header>
      <Card.Content>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <PasswordField
            name="current"
            label="Temporary password"
            autoComplete="current-password"
            isRequired
            value={current}
            onChange={setCurrent}
            description="The one from your welcome email."
          />
          <PasswordField
            name="next"
            label="New password"
            autoComplete="new-password"
            isRequired
            value={next}
            onChange={setNext}
            description="Use at least 8 characters."
            isInvalid={tooShort || reused}
            errorMessage={
              reused
                ? "Choose a password different from the temporary one."
                : "Password must be at least 8 characters."
            }
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

          {reauth && <ReauthNotice returnTo="/set-password" />}

          <div>
            <Button type="submit" isPending={saving} isDisabled={!canSubmit}>
              {saving ? "Saving…" : "Save password"}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
