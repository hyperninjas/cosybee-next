"use client";

import { useTransition } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

/**
 * Layout wrapper for the two provider connect steps in the onboarding
 * funnel (SunSync, Octopus). The provider's connect modal — which owns
 * its own trigger button — is passed in via `children`, and the "Skip
 * for now" affordance is rendered below.
 *
 * Rationale for skipping: the mobile app treats provider connect as
 * optional (Settings → Connected Accounts). The web funnel mirrors that
 * so a user who signed up on desktop without their SunSync password to
 * hand isn't trapped mid-flow — the dashboard's ProviderStatusBar keeps
 * nudging them to complete the missing link.
 *
 * The Skip button uses `useTransition` around `router.push` so the app
 * router marks the next page's render as a transition — `isPending`
 * stays true from click through until that page's server component has
 * finished rendering, which lets us show "Skipping…" + a disabled
 * button rather than a dead click.
 */

interface Props {
  /**
   * Provider connect modal (with its own trigger button as its child).
   * Rendered as the primary CTA at the top of the step.
   */
  children: React.ReactNode;
  /** Where "Skip for now" takes the user (next onboarding step or dashboard). */
  skipHref: string;
}

export function ConnectStep({ children, skipHref }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-6">
      <div>{children}</div>
      <div className="flex items-center justify-between">
        <Button
          variant="tertiary"
          isDisabled={pending}
          onPress={() => startTransition(() => router.push(skipHref))}
        >
          {pending ? "Skipping…" : "Skip for now"}
        </Button>
        <p className="text-xs text-muted">
          You can add or change this later from the dashboard.
        </p>
      </div>
    </div>
  );
}
