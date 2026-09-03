"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Card, Spinner } from "@heroui/react";
import { Geo } from "@gravity-ui/icons";
import { OnboardingProgress } from "@/app/components/onboarding/OnboardingProgress";
import { AddressSearch } from "@/app/components/onboarding/AddressSearch";

/**
 * Client half of step 1. Kept separate so the page.tsx can stay a server
 * component and run the "already onboarded → bounce to dashboard" gate
 * before any UI mounts. On pick, pushes to
 * `/onboarding/building-profile?key=<opaque AFD key>&label=<display>` —
 * the opaque key is what the next step re-retrieves the full address
 * from, so the browser back button behaves and a shared/refreshed URL
 * still works.
 *
 * The navigation runs inside `useTransition` so `isPending` covers the
 * full "picked → next server-rendered step is ready" window, and the
 * card swaps to a "Looking up your home…" state instead of leaving the
 * user staring at their search box for 1–2 s while the EPC lookup runs.
 */
export function AddressStepClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <OnboardingProgress
        step={1}
        total={4}
        title="Where do you live?"
        description="We use your address to look up your home's EPC and pull region-specific tariff data."
      />
      <Card variant="default">
        <Card.Content className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Geo className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-foreground">
                Address or postcode
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Start typing and pick your home from the list.
              </p>
            </div>
          </div>

          {pending ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary p-4">
              <Spinner size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Looking up your home…
                </p>
                <p className="text-xs text-muted">
                  Fetching the EPC record and preparing the next step.
                </p>
              </div>
            </div>
          ) : (
            <AddressSearch
              autoFocus
              onPick={(key, label) => {
                const q = new URLSearchParams({ key, label }).toString();
                startTransition(() =>
                  router.push(`/onboarding/building-profile?${q}`),
                );
              }}
            />
          )}

          <Alert status="default">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>How we use your address</Alert.Title>
              <Alert.Description>
                Your address is used to fetch a public EPC record for the
                property and to bucket you into the correct GB electricity
                distribution region — nothing else. We never share it with
                third parties.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </Card.Content>
      </Card>
    </>
  );
}
