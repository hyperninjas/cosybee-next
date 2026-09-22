"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
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
 * field swaps to a "Looking up your home…" line instead of leaving the
 * user staring at their search box for 1–2 s while the EPC lookup runs.
 *
 * The `flow` prop switches the on-screen copy AND the query string that
 * gets forwarded to step 2. `first-time` is the linear 4-step onboarding
 * that flows on into `/onboarding/connect-sunsync`; `add-property` is the
 * dashboard re-entry that skips the connect steps and lands back on
 * `/dashboard` (matches mobile's add-another-home path — the new home
 * just becomes active and the ProviderStatusBar tiles handle Sunsynk /
 * Octopus per home from there).
 */
interface Props {
  flow: "first-time" | "add-property";
}

export function AddressStepClient({ flow }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isAddProperty = flow === "add-property";

  return (
    <>
      <OnboardingProgress
        // First-time onboarding is 4 steps (address → building profile →
        // sunsync → octopus). Add-property is 2 (address → building profile
        // → straight back to dashboard); rendering "Step 1 of 4" on that
        // path would be a lie in the same shape as the mobile "step 3 of
        // 4" complaint the guide flagged as a footgun.
        step={1}
        total={isAddProperty ? 2 : 4}
        title={isAddProperty ? "Add another home" : "Where do you live?"}
        description={
          isAddProperty
            ? "Search for the home you want to add. It becomes the active home once created — you can switch back from Manage property."
            : "We use your address to find your home's EPC and your local tariff rates."
        }
      />

      {pending ? (
        <div role="status" className="flex items-center gap-3">
          <Spinner size="sm" />
          <p className="text-sm text-muted">
            Looking up your home — fetching the EPC record…
          </p>
        </div>
      ) : (
        <AddressSearch
          autoFocus
          label="Address or postcode"
          description="Start typing, then pick your home from the list."
          onPick={(key, label) => {
            // Forward the `flow` flag to step 2 so its gate + on-success
            // redirect match. Absent flag defaults to first-time, so
            // existing links from other places in the app stay pointed
            // at the linear funnel.
            const params: Record<string, string> = { key, label };
            if (isAddProperty) params["flow"] = "add-property";
            const q = new URLSearchParams(params).toString();
            startTransition(() =>
              router.push(`/onboarding/building-profile?${q}`),
            );
          }}
        />
      )}
    </>
  );
}
