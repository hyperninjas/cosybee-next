import { requireNoPropertyYet } from "@/app/lib/server-session";
import { AddressStepClient } from "./AddressStepClient";

/**
 * Step 1 of onboarding: address search.
 *
 * Server component so the "already onboarded" gate runs before any UI
 * paints — a non-admin user with ≥1 property is sent to the dashboard
 * rather than allowed to start creating a duplicate. The interactive
 * part (combobox + navigation on pick) lives in {@link AddressStepClient}
 * because HeroUI's ComboBox needs a client boundary.
 */
export default async function AddressStepPage() {
  await requireNoPropertyYet();
  return <AddressStepClient />;
}
