"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import {
  Alert,
  Button,
  Chip,
  Modal,
  Radio,
  RadioGroup,
  useOverlayState,
} from "@heroui/react";
import { HouseFill } from "@gravity-ui/icons";
import { TextInputField } from "@/app/components/ui/TextInputField";
import { AddressSearch } from "@/app/components/onboarding/AddressSearch";
import { activateProperty, updateProperty } from "@/app/lib/property-actions";
import { retrieveAddress, type ResolvedAddress } from "@/app/lib/onboarding-actions";
import { displayAddress } from "@/app/lib/address-format";
import type { ActiveProperty } from "@/app/lib/property-state";

/**
 * Post-connect management dialog for the active property.
 *
 * Two responsibilities in one modal, deliberately merged because the tile
 * that opens it only affords one trigger:
 *
 *   1. EDIT this home — rename and/or re-address. Both fields save
 *      together via ONE `PATCH /api/properties/:id` so a customer who
 *      changed both doesn't have to click twice, and so the AFD-derived
 *      geocode / postcode / uprn travel with the composed address string
 *      atomically. Firing them as two separate PATCHes was the earlier
 *      pattern — it left the door open to "saved the name, then the
 *      network died, so my address never made it" states, and the two
 *      buttons made the dialog read like a form with two heads.
 *   2. SWITCH the active home. Only rendered when the account has more
 *      than one; that's a distinct backend call (`activate`) and needs
 *      its own inline button.
 *
 * ### Address flow — mirrors onboarding
 *
 *   • `AddressSearch` typeahead against the AFD postcode proxy — same
 *     component the signup flow uses, so the search here behaves
 *     identically to the one that first created the property. Consistency
 *     matters here: mixing a hand-typed field into an AFD-linked property
 *     silently drifts the display address away from the geocoded
 *     lat/lng, which then powers the weather forecast against a
 *     different location than the label reads.
 *   • On pick → `retrieveAddress(key)` (server action) → the full
 *     `ResolvedAddress` is held locally so Save can send address +
 *     postcode + uprn + latitude + longitude as ONE atomic PATCH.
 */

interface Props {
  children: ReactNode;
  /** The home currently pinned to this session — source of the initial field values. */
  active: ActiveProperty;
  /** Every non-archived home on the account, for the switch list. */
  properties: ActiveProperty[];
}

export function ManagePropertyModal({ children, active, properties }: Props) {
  const overlay = useOverlayState();

  // ── Edit state (rename + re-address share one Save) ───────────────
  //
  // `label` is controlled from the start so "Save" can disable itself
  // when nothing is dirty. `pickedAddress` starts null and only becomes
  // set once the user completes the AFD flow — that's the signal Save
  // uses to include address / postcode / uprn / geocode in the PATCH.
  const [label, setLabel] = useState<string>(active.label ?? "");
  const [pickedAddress, setPickedAddress] = useState<ResolvedAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savePending, startSave] = useTransition();
  const [addressResolving, startAddressResolve] = useTransition();

  const labelDirty = label.trim() !== (active.label ?? "").trim();
  const addressDirty = pickedAddress !== null;
  const anyDirty = labelDirty || addressDirty;

  function handlePickAddress(key: string) {
    setError(null);
    startAddressResolve(async () => {
      const resolved = await retrieveAddress(key);
      if (!resolved) {
        setError("Couldn't retrieve that address. Pick another suggestion.");
        setPickedAddress(null);
        return;
      }
      setPickedAddress(resolved);
    });
  }

  function handleSave() {
    if (!anyDirty) return;
    setError(null);
    startSave(async () => {
      // Only include fields the user changed — a form that only edited
      // `label` must not overwrite `address` / `postcode` / `uprn` with
      // undefined-normalised nulls.
      const result = await updateProperty(active.id, {
        ...(labelDirty ? { label } : {}),
        ...(pickedAddress
          ? {
              address: displayAddress(pickedAddress),
              postcode: pickedAddress.postcode,
              uprn: pickedAddress.uprn,
              latitude: pickedAddress.latitude,
              longitude: pickedAddress.longitude,
            }
          : {}),
      });
      if (!result.ok) setError(result.error);
      else overlay.close();
    });
  }

  // ── Switch state (separate: different endpoint + full reload) ─────
  const canSwitch = properties.length > 1;
  const [switchTarget, setSwitchTarget] = useState<string>(active.id);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switchPending, startSwitch] = useTransition();

  function handleSwitch() {
    if (switchTarget === active.id) return;
    setSwitchError(null);
    startSwitch(async () => {
      const result = await activateProperty(switchTarget);
      if (!result.ok) setSwitchError(result.error);
      else overlay.close();
    });
  }

  // The "on file" summary reads from the row, not from an AFD refetch —
  // that stays honest even if the DB drifts from what AFD would return
  // today (postcode boundaries do get redrawn occasionally).
  const currentAddressLine =
    active.address?.trim() || active.postcode || "No address on file";

  return (
    <Modal isOpen={overlay.isOpen} onOpenChange={overlay.setOpen}>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="md" placement="center">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Manage property</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                {canSwitch
                  ? "Update your home details or switch to another home."
                  : "Update your home details."}
              </p>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-5">
              {/* ── Summary card ────────────────────────────────────
                  Mirrors the onboarding "Your home" panel so a customer
                  who reaches this dialog reads the same block they read
                  at signup — same rounded surface, same typography, same
                  content weight. Shows the CURRENT row, not the pending
                  one; the "Will change to" preview lives beside the
                  AddressSearch below. */}
              <div className="rounded-2xl bg-surface-secondary px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-default-100 text-default-600">
                    <HouseFill className="size-4" aria-hidden />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-xs font-medium text-muted">Your home</p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {active.label || "Untitled home"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {currentAddressLine}
                      {active.postcode ? ` · ${active.postcode}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}

              {/* ── Name field ────────────────────────────────────── */}
              <TextInputField
                name="label"
                label="Home name"
                placeholder="Home Sweet Home"
                autoComplete="off"
                value={label}
                onChange={setLabel}
                icon={<HouseFill aria-hidden className="size-4" />}
              />

              {/* ── Address (AFD lookup) ────────────────────────────
                  No description spam — the field label carries the
                  intent, the AddressSearch's own placeholder ("Start
                  typing a postcode…") carries the how, and the "Will
                  save" preview below carries the result. Three lines of
                  paragraph copy explaining that the geocode also
                  updates was gratuitous — this modal is for people who
                  already understand "change my address". */}
              <AddressSearch
                onPick={handlePickAddress}
                label="Change address"
              />

              {addressResolving && (
                <p className="-mt-2 text-xs text-muted">Resolving address…</p>
              )}

              {pickedAddress && !addressResolving && (
                <div className="-mt-2 rounded-2xl bg-success/5 px-4 py-3 ring-1 ring-success/20">
                  <p className="text-xs font-medium text-success">
                    Will save on next update
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {displayAddress(pickedAddress)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {pickedAddress.postcode}
                  </p>
                </div>
              )}

              {/* ── Switch (multi-home only) ──────────────────────── */}
              {canSwitch && (
                <div className="flex flex-col gap-3 rounded-2xl bg-surface-secondary px-4 py-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-foreground">
                      Switch home
                    </p>
                    <p className="text-xs text-muted">
                      Every card on the dashboard reads the active home.
                    </p>
                  </div>

                  {switchError && (
                    <Alert status="danger">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Description>{switchError}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}

                  <RadioGroup
                    aria-label="Active home"
                    value={switchTarget}
                    onChange={setSwitchTarget}
                    className="flex flex-col gap-2"
                  >
                    {properties.map((p) => (
                      <Radio key={p.id} value={p.id}>
                        <div className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <span className="truncate">
                              {p.label || "Untitled home"}
                            </span>
                            {p.id === active.id && (
                              <Chip color="success" variant="soft" size="sm">
                                Active
                              </Chip>
                            )}
                          </span>
                          <span className="truncate text-xs text-muted">
                            {p.address}
                            {p.postcode ? ` · ${p.postcode}` : ""}
                          </span>
                        </div>
                      </Radio>
                    ))}
                  </RadioGroup>

                  <div className="flex justify-end">
                    <Button
                      variant="tertiary"
                      size="sm"
                      onPress={handleSwitch}
                      isDisabled={switchTarget === active.id || switchPending}
                    >
                      {switchPending ? "Switching…" : "Switch home"}
                    </Button>
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              {/* HeroUI's default CloseTrigger renders its own dismiss
                  button — matches every other modal in the app. */}
              <Modal.CloseTrigger />
              <Button
                variant="primary"
                onPress={handleSave}
                isDisabled={!anyDirty || savePending || addressResolving}
              >
                {savePending ? "Saving…" : "Save changes"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
