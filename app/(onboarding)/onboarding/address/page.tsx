import { requireNoPropertyYet, requireOnboarded } from "@/app/lib/server-session";
import { AddressStepClient } from "./AddressStepClient";

/**
 * Step 1 of onboarding: address search.
 *
 * Server component so the "already onboarded" gate runs before any UI
 * paints. The gate flips based on the `flow` query parameter:
 *
 *   • omitted / `first-time` — the default. Blocks users who ALREADY have
 *     a home from restarting the funnel and creating a duplicate, via
 *     {@link requireNoPropertyYet}.
 *   • `add-property` — the "add another home" entry from the dashboard's
 *     Manage-property dialog. Requires the OPPOSITE guard: the user must
 *     already be onboarded (mirrors mobile's `AddressSwitcherSheet` → +
 *     Add another address flow at
 *     `energiebeemobile/lib/features/address_switcher/presentation/
 *     widgets/address_switcher_sheet.dart:159`). Zero-home users hitting
 *     this URL fall through to the first-time flow via `requireOnboarded`'s
 *     own redirect to `/onboarding/address` — no infinite loop because the
 *     redirect drops the query string, so on the second hit the guard
 *     switches back to `requireNoPropertyYet` and passes.
 *
 * The interactive part (combobox + navigation on pick) lives in
 * {@link AddressStepClient} because HeroUI's ComboBox needs a client
 * boundary.
 */
export default async function AddressStepPage({
  searchParams,
}: {
  searchParams: Promise<{ flow?: string }>;
}) {
  const { flow } = await searchParams;
  const isAddProperty = flow === "add-property";
  if (isAddProperty) {
    await requireOnboarded();
  } else {
    await requireNoPropertyYet();
  }
  return <AddressStepClient flow={isAddProperty ? "add-property" : "first-time"} />;
}
