import type { ResolvedAddress } from "./onboarding-actions";

/**
 * Compose a single-line display address from an AFD `ResolvedAddress`.
 *
 * AFD returns the address in pieces — `property` (building line, e.g.
 * "1 Gorple Cottages" or "Flat 3"), `street`, `locality`, `town`,
 * `county` — because that lets the EPC matcher key on the building line
 * alone. For DISPLAY we want the same comma-joined string the
 * onboarding flow persisted on the property row, so the address the
 * user picks in the Manage-property dialog reads the same way as the
 * one they picked at signup.
 *
 * `organisation` leads when present (business / care-of), then the
 * building line, then the street, locality, town, county — trimmed and
 * blank parts dropped so a numbered address without a building line
 * doesn't render as "House, , Street, …".
 *
 * Kept pure so it composes trivially into tests, `.map`, and SSR.
 */
export function displayAddress(addr: ResolvedAddress): string {
  return [
    addr.organisation,
    addr.property,
    addr.street,
    addr.locality,
    addr.town,
    addr.county,
  ]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(", ");
}
