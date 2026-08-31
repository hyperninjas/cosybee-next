import { redirect } from "next/navigation";
import { OnboardingProgress } from "@/app/components/onboarding/OnboardingProgress";
import { BuildingProfileClient } from "@/app/components/onboarding/BuildingProfileClient";
import { retrieveAddress, searchEpcByPostcode } from "@/app/lib/onboarding-actions";

/**
 * Step 2 of onboarding: EPC lookup + property create.
 *
 * The page is a server component so:
 *   • The opaque AFD `key` (from step 1) is resolved server-side — the
 *     browser never sees the intermediate call.
 *   • The postcode is handed straight to `GET /api/epc/search` in the
 *     same render pass — one round-trip instead of two.
 *   • If the address can't be re-retrieved (link expired, wrong key),
 *     the user is bounced back to the address step rather than shown a
 *     confusing empty screen.
 *
 * The interactive parts (picker, submit, no-EPC fallback) live in
 * `BuildingProfileClient` so the server component stays a pure fetch.
 */
export default async function BuildingProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; label?: string }>;
}) {
  const { key } = await searchParams;
  if (!key) redirect("/onboarding/address");

  const address = await retrieveAddress(key);
  if (!address) redirect("/onboarding/address");

  // Fetch EPCs in the same render — cheap when the backend cache is warm,
  // and moved onto the same trip regardless. `[]` is a normal outcome
  // (new-build, non-domestic) that the client handles as the no-EPC path.
  const epcs = await searchEpcByPostcode(address.postcode);

  return (
    <>
      <OnboardingProgress
        step={2}
        total={4}
        title="Your building profile"
        description="We looked up the public EPC record for this postcode. Pick your home to pull in its ratings, or continue without an EPC."
      />
      <BuildingProfileClient address={address} epcs={epcs} />
    </>
  );
}
