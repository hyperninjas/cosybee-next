import { Button } from "@heroui/react";
import { OnboardingProgress } from "@/app/components/onboarding/OnboardingProgress";
import { ConnectStep } from "@/app/components/onboarding/ConnectStep";
import { ConnectOctopusModal } from "@/app/components/sections/connect/ConnectOctopusModal";

/**
 * Step 4 of onboarding: connect Octopus. Reuses the existing modal (same
 * rationale as the SunSync step above) and hands off to the dashboard on
 * either "Skip for now" or a successful connect. From here the funnel is
 * done and the user lives on `/energyflow-home`.
 */
export default function ConnectOctopusStep() {
  return (
    <>
      <OnboardingProgress
        step={4}
        total={4}
        title="Connect your tariff"
        description="Link your Octopus account so the dashboard can show your live tariff and daily cost. Skip for now if you'd rather do this later."
      />
      <ConnectStep skipHref="/energyflow-home">
        <ConnectOctopusModal successHref="/energyflow-home">
          <Button variant="primary" size="lg" fullWidth>
            Connect Octopus
          </Button>
        </ConnectOctopusModal>
      </ConnectStep>
    </>
  );
}
