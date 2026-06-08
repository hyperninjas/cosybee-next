"use client";

import { useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import { ORG_CONTACT_EMAIL } from "@/app/lib/site";

export function BannedContent() {
  const router = useRouter();

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Account suspended</Card.Title>
          <Card.Description>
            Your account has been banned and you&apos;ve been signed out.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-muted">
            If you believe this is a mistake, contact support and we&apos;ll
            take a look.
          </p>
        </Card.Content>
        <Card.Footer className="flex flex-col gap-2">
          <Button
            className="w-full"
            onPress={() => {
              window.location.href = `mailto:${ORG_CONTACT_EMAIL}`;
            }}
          >
            Contact support
          </Button>
          <Button
            className="w-full"
            variant="tertiary"
            onPress={() => router.push("/login")}
          >
            Sign in with a different account
          </Button>
        </Card.Footer>
      </Card>
    </main>
  );
}
