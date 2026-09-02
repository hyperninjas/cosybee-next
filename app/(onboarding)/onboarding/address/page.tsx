"use client";

import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/app/components/onboarding/OnboardingProgress";
import { AddressSearch } from "@/app/components/onboarding/AddressSearch";

/**
 * Step 1 of onboarding: address search.
 *
 * The user picks their home from AFD Postcode Evolution results (same
 * source of truth as the mobile app's location step). On pick, we push
 * to `/onboarding/building-profile?key=<opaque AFD key>&label=<display>` —
 * the opaque key is what the next step re-retrieves the full address
 * from, so the browser back button behaves and a shared/refreshed URL
 * still works.
 */
export default function AddressStepPage() {
  const router = useRouter();

  return (
    <>
      <OnboardingProgress
        step={1}
        total={4}
        title="Where do you live?"
        description="We use your address to look up your home's EPC and pull region-specific tariff data."
      />
      <div className="flex flex-col gap-8">
        <AddressSearch
          autoFocus
          onPick={(key, label) => {
            const q = new URLSearchParams({ key, label }).toString();
            router.push(`/onboarding/building-profile?${q}`);
          }}
        />
        <p className="text-xs text-muted">
          Your address is used to fetch a public EPC record for the property
          and to bucket you into the correct GB electricity distribution
          region — nothing else. We never share it with third parties.
        </p>
      </div>
    </>
  );
}
