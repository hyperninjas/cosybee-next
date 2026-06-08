"use client";

import { Alert } from "@heroui/react";
import { AppLink as Link } from "@/app/components/ui/AppLink";

/**
 * Shown when a sensitive action (delete account, disable 2FA, change
 * password/email) is rejected because the session is older than the backend's
 * `freshAge` (1 day). Re-signing in refreshes the session age.
 */
export function ReauthNotice({
  returnTo = "/account/security",
}: {
  returnTo?: string;
}) {
  return (
    <Alert status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Please sign in again</Alert.Title>
        <Alert.Description>
          For your security this action needs a recent sign-in.{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(returnTo)}`}
            variant="link"
            className="font-medium"
          >
            Sign in again
          </Link>
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
