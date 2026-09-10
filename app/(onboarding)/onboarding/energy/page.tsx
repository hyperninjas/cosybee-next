import { OnboardingProgress } from "@/app/components/onboarding/OnboardingProgress";
import { EnergySetupClient } from "@/app/components/onboarding/EnergySetupClient";
import { listEnergyProviders } from "@/app/lib/energy-actions";
import { getActiveProperty } from "@/app/lib/property-state";

/**
 * Step 4 of onboarding: who supplies your energy, and on what tariff?
 *
 * Replaces the old "Connect Octopus" step, which offered exactly one supplier
 * out of the twenty-one in the catalog. Everyone else could only skip, and
 * skipping meant reaching the dashboard with no tariff — so no unit rate, no
 * standing charge, and no cost figures anywhere.
 *
 * This is the web port of mobile's supplier → tariff → monthly-bill chain,
 * with one addition: when the chosen supplier is one we can link to for live
 * data, we offer that first. Picking Octopus and connecting is strictly
 * better than picking Octopus and typing a bill estimate, so the offer goes
 * where the customer has just told us it's relevant.
 *
 * The provider list is fetched here rather than in the client so the step
 * renders with its options already in place — a searchable list that pops in
 * after paint reads as broken on a slow connection.
 */
export default async function EnergyStepPage() {
  // Tariff rates are regional, so both the provider list and the tariff list
  // are scoped by the active property's postcode. Mobile hit an empty tariff
  // list by querying before this resolved, which reads as "no tariffs exist"
  // rather than "not loaded yet".
  const property = await getActiveProperty();
  const postcode = property?.postcode ?? "";
  const providers = await listEnergyProviders(postcode);

  return (
    <>
      <OnboardingProgress
        step={4}
        total={4}
        title="Your energy supplier"
        description="We use your tariff to work out what your energy actually costs."
      />
      <EnergySetupClient providers={providers} postcode={postcode} />
    </>
  );
}
