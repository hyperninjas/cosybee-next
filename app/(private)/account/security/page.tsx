"use client";

import { Card, Spinner } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { ChangePasswordCard } from "./_components/ChangePasswordCard";
import { TwoFactorCard } from "./_components/TwoFactorCard";
import { SessionsCard } from "./_components/SessionsCard";
import { DangerZoneCard } from "./_components/DangerZoneCard";

export default function SecurityPage() {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <Card className="items-center justify-center p-10">
        <Spinner />
      </Card>
    );
  }

  const user = data?.user;
  if (!user) return null;

  return (
    <>
      <ChangePasswordCard />
      <TwoFactorCard initialEnabled={Boolean(user.twoFactorEnabled)} />
      <SessionsCard currentToken={data?.session?.token ?? undefined} />
      <DangerZoneCard currentEmail={user.email} />
    </>
  );
}
