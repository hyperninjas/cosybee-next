"use client";

import { Alert } from "@heroui/react";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { useSession } from "@/app/lib/auth-client";

/**
 * Shown to a signed-in user whose email isn't verified yet. Writes (uploads,
 * etc.) are blocked by the backend until they verify, so this nudges them.
 * Renders nothing when there's no user or they're already verified.
 */
export function VerifyEmailBanner() {
  const { data } = useSession();
  const user = data?.user;
  if (!user || user.emailVerified) return null;

  return (
    <Alert status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Verify your email</Alert.Title>
        <Alert.Description>
          Confirm your email address to enable saving changes and uploads.{" "}
          <Link
            href={`/verify-email?email=${encodeURIComponent(user.email)}`}
            variant="link"
            className="font-medium"
          >
            Verify now
          </Link>
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
