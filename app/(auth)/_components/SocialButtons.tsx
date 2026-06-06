"use client";

import { useState } from "react";
import { Button, Separator } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { SOCIAL_PROVIDERS, type SocialProviderId } from "@/app/lib/auth-providers";

/**
 * Social sign-in buttons shared by the login & register pages. Renders nothing
 * when no providers are enabled in `auth-providers.tsx`. Each button kicks off
 * the OAuth redirect via better-auth and returns to `callbackURL` on success.
 */
export function SocialButtons({ callbackURL }: { callbackURL: string }) {
  const [busy, setBusy] = useState<SocialProviderId | null>(null);

  if (SOCIAL_PROVIDERS.length === 0) return null;

  async function signInWith(provider: SocialProviderId) {
    setBusy(provider);
    try {
      await authClient.signIn.social({ provider, callbackURL });
    } finally {
      // On success the browser navigates away; reset only if it didn't.
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted">or</span>
        <Separator className="flex-1" />
      </div>
      {SOCIAL_PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="w-full justify-center gap-2.5"
          isPending={busy === provider.id}
          onPress={() => signInWith(provider.id)}
        >
          {provider.icon}
          {provider.label}
        </Button>
      ))}
    </div>
  );
}
