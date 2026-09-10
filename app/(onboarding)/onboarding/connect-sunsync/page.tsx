import { Button } from "@heroui/react";
import { OnboardingProgress } from "@/app/components/onboarding/OnboardingProgress";
import { ConnectStep } from "@/app/components/onboarding/ConnectStep";
import { ConnectSunSyncModal } from "@/app/components/sections/connect/ConnectSunSyncModal";
import { SolarSetupClient } from "@/app/components/onboarding/SolarSetupClient";
import { getSolarOptions } from "@/app/lib/solar-actions";

/**
 * Step 3 of onboarding: the home's solar and battery kit.
 *
 * This step used to be "Connect Sunsynk" and nothing else — one brand of
 * the twelve we model. Everyone else could only skip, and their system then
 * didn't exist as far as the app was concerned: no capacity, no generation
 * estimate, no export eligibility.
 *
 * It now asks what they have. Sunsynk owners still get the live connection
 * offered first, because reading the inverter beats describing it; everyone
 * else describes their system and gets the estimate that comes with it.
 *
 * The catalog is fetched here rather than in the client so the brand list is
 * present on first paint. If it can't be reached we fall back to the old
 * connect-only screen — a Sunsynk owner can still link, which is better than
 * a dead step.
 */
export default async function SolarStepPage() {
  const options = await getSolarOptions();

  if (options === null) {
    return (
      <>
        <OnboardingProgress
          step={3}
          total={4}
          title="Connect your inverter"
          description="Link your Sunsynk account to see live solar and battery data."
        />
        <ConnectStep
          skipHref="/onboarding/energy"
          points={[
            "Live solar generation and battery charge",
            "Home load and grid flow in real time",
            "Daily kWh totals and 24-hour power history",
          ]}
        >
          <ConnectSunSyncModal successHref="/onboarding/energy">
            <Button variant="primary" size="lg">
              Connect Sunsynk
            </Button>
          </ConnectSunSyncModal>
        </ConnectStep>
      </>
    );
  }

  return (
    <>
      <OnboardingProgress
        step={3}
        total={4}
        title="Your solar setup"
        description="Tell us what you have and we'll estimate what it generates."
      />
      <SolarSetupClient options={options} />
    </>
  );
}
