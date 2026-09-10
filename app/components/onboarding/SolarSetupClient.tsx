"use client";

import { useRouter } from "next/navigation";

import { SolarSetupFlow } from "@/app/components/sections/solar/SolarSetupFlow";
import type { SolarOptions } from "@/app/lib/solar-actions";

/**
 * Onboarding's binding of the solar declaration flow.
 *
 * The flow lives in `sections/solar` because the dashboard runs the same one
 * for anyone who arrives without a system declared. All this decides is
 * where the step goes next — including "I don't have solar", which is a real
 * answer rather than a skip, and moves on just the same.
 */
export function SolarSetupClient({ options }: { options: SolarOptions }) {
  const router = useRouter();
  const next = () => router.push("/onboarding/energy");
  return <SolarSetupFlow options={options} onDone={next} onSkip={next} />;
}
