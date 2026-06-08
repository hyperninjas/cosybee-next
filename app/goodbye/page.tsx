import type { Metadata } from "next";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { Card } from "@heroui/react";

export const metadata: Metadata = {
  title: "Account deleted",
  robots: { index: false, follow: false },
};

export default function GoodbyePage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Your account has been deleted</Card.Title>
          <Card.Description>
            We&apos;ve removed your account and all associated data, and sent a
            confirmation to your email. We&apos;re sorry to see you go — you&apos;re
            always welcome back.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="justify-center">
          <Link href="/" variant="link" className="font-medium">
            Back to EnergieBee
          </Link>
        </Card.Footer>
      </Card>
    </main>
  );
}
