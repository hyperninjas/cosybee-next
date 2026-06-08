"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

/**
 * Landing page for the change-email confirmation link. better-auth verifies the
 * token + switches the email server-side, then redirects the user here. We just
 * bust the session cache so the new email shows, and confirm success.
 */
export default function EmailChangedPage() {
  const router = useRouter();

  useEffect(() => {
    authClient.getSession({ query: { disableCookieCache: true } }).then(() => {
      router.refresh();
    });
  }, [router]);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Email updated</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Your email address has been changed.</Alert.Title>
          </Alert.Content>
        </Alert>
      </Card.Content>
      <Card.Footer>
        <Button onPress={() => router.push("/account/security")}>
          Back to security settings
        </Button>
      </Card.Footer>
    </Card>
  );
}
