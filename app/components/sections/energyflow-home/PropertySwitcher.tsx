"use client";

import { Button } from "@heroui/react";
import { HouseFill } from "@gravity-ui/icons";
import { ManagePropertyModal } from "@/app/components/sections/manage/ManagePropertyModal";
import type { ActiveProperty } from "@/app/lib/property-state";

/**
 * Compact home-switcher pill for the dashboard header.
 *
 * Ports mobile's `AddressSwitcherButton`
 * (`energiebeemobile/lib/features/address_switcher/presentation/widgets/
 * address_switcher_button.dart`) — the pill that sits in the home screen
 * header and opens the full switcher sheet on tap. On the web the sheet
 * is {@link ManagePropertyModal}, which owns switch + add + archive in
 * one dialog; this component is just the pill that triggers it. Making
 * this the trigger instead of an old, separate switch-only modal
 * (returned by the 2026-09-03 design pass to a chip that was itself
 * hidden) gets rid of the parallel switch UI that could otherwise drift
 * from Manage-property in copy, in the shape of its confirmation state,
 * or in which fields it reads.
 *
 * Even a single-home account gets the trigger — clicking still opens
 * Manage-property, which is where rename, re-address and add-another
 * live. Mobile's pill is passive when there's only one home; on web
 * we've merged those two states because the button label alone would
 * hide a useful entry point.
 *
 * Returns `null` when there are zero properties — the caller (the
 * dashboard header) should not render us at all in that case, but we
 * defend against a race where a signed-in user hits the dashboard
 * between archiving their last home and being redirected to
 * onboarding.
 */
interface Props {
  properties: ActiveProperty[];
  activeId: string | null;
}

export function PropertySwitcher({ properties, activeId }: Props) {
  if (properties.length === 0) return null;

  const active =
    properties.find((p) => p.id === activeId) ?? properties[0];
  if (!active) return null;

  const label = active.label || "Home";
  // Second-line hint. Only surfaced when there's more than one home,
  // because a single-home user already knows which home they're
  // looking at — the pill would just repeat address info that's on the
  // Property tile below it.
  const countHint =
    properties.length > 1 ? ` · ${properties.length} homes` : "";

  return (
    <ManagePropertyModal active={active} properties={properties}>
      <Button size="sm" variant="tertiary">
        <HouseFill className="mr-1.5 inline size-4 align-middle" />
        <span className="truncate">
          {label}
          {countHint}
        </span>
      </Button>
    </ManagePropertyModal>
  );
}
