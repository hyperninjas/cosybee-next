"use client";

import { useRouter } from "next/navigation";

import { EnergySetupFlow } from "@/app/components/sections/energy/EnergySetupFlow";
import type { EnergyProvider } from "@/app/lib/energy-actions";

/**
 * Onboarding's binding of the supplier → tariff → bill flow.
 *
 * The flow itself lives in `sections/energy` because the dashboard runs the
 * same one from a dialog — a customer who reaches the dashboard without a
 * tariff needs the same three questions, not a different shortcut. All this
 * wrapper decides is where "done" goes: the end of the funnel.
 */
export function EnergySetupClient({
  providers,
  postcode,
}: {
  providers: EnergyProvider[];
  postcode: string;
}) {
  const router = useRouter();
  return (
    <EnergySetupFlow
      providers={providers}
      postcode={postcode}
      onDone={() => router.push("/dashboard")}
    />
  );
}
