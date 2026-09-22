"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Chip,
  Modal,
  Radio,
  RadioGroup,
  useOverlayState,
} from "@heroui/react";
import { HouseFill, Plus, TrashBin } from "@gravity-ui/icons";
import { TextInputField } from "@/app/components/ui/TextInputField";
import { AddressSearch } from "@/app/components/onboarding/AddressSearch";
import {
  activateProperty,
  archiveProperty,
  updateProperty,
} from "@/app/lib/property-actions";
import { retrieveAddress, type ResolvedAddress } from "@/app/lib/onboarding-actions";
import { displayAddress } from "@/app/lib/address-format";
import type { ActiveProperty } from "@/app/lib/property-state";

/**
 * Matches `MAX_PROPERTIES_PER_USER` in
 * `eb-auth/src/modules/properties/properties.service.ts` — the backend
 * throws `PropertyLimitError` (→ 409) once the user reaches this count.
 * Mirrored client-side so the "Add another home" button can grey out
 * BEFORE the trip to the backend, and the banner explains what's
 * happening instead of the flow ending in an opaque red toast.
 *
 * If the backend limit changes, update this constant to match — a stale
 * value here degrades gracefully to "backend rejects, banner shows the
 * upstream message" instead of blocking users prematurely.
 */
const MAX_PROPERTIES_PER_USER = 25;

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
  // `useRouter` from next/navigation for the "Add another home" push.
  // Closed-overlay-then-push order matters: leaving the modal mounted
  // through the navigation kept the focus trap on this dialog while the
  // /onboarding/address page tried to focus its ComboBox, and the trap
  // won — the address field never took focus without a second Tab.
  const router = useRouter();

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

  // ── Archive state ─────────────────────────────────────────────────
  //
  // Two-step confirm to prevent a stray tap from dropping a home: the
  // trash-icon per row sets `archiveTarget`, which swaps that row's
  // right-hand action for a "Confirm archive" pair. Cancel drops back
  // to the trash icon; Archive fires the server action.
  //
  // The archive server action re-scopes the active property when the
  // archived one WAS active (matches mobile). If that happens, the
  // return payload carries `newActivePropertyId` — we close the modal
  // and let `revalidatePath` (inside the server action) repaint the
  // dashboard against the new home. When the archived one was a
  // background home, closing the modal is the same UX with a cheaper
  // re-render.
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archivePending, startArchive] = useTransition();

  function handleArchiveRequest(id: string) {
    setArchiveError(null);
    setArchiveTarget(id);
  }

  function handleArchiveCancel() {
    setArchiveTarget(null);
    setArchiveError(null);
  }

  function handleArchiveConfirm() {
    if (archiveTarget === null) return;
    setArchiveError(null);
    startArchive(async () => {
      const result = await archiveProperty(archiveTarget);
      if (!result.ok) {
        setArchiveError(result.error);
        return;
      }
      overlay.close();
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

              {/* ── Your homes ────────────────────────────────────
                  Always rendered, unlike the previous switch-only block:
                  even a single-home user reaches the "Add another home"
                  button through this section. Layout matches mobile's
                  `AddressSwitcherSheet`
                  (`energiebeemobile/lib/features/address_switcher/
                  presentation/widgets/address_switcher_sheet.dart:14`) —
                  a list of homes with per-row archive + a trailing
                  "Add another address" action. On the web the radio-list
                  + Switch pattern survives because that's how we
                  activate; add is a separate route push, not a modal
                  action.

                  When `archiveTarget` is set, the section's normal
                  contents swap out for a confirmation panel. Keeping it
                  IN this section (rather than a nested AlertDialog)
                  avoids the focus-trap gymnastics HeroUI's dialogs need
                  when stacked. */}
              <div className="flex flex-col gap-3 rounded-2xl bg-surface-secondary px-4 py-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">
                    Your homes
                  </p>
                  <p className="text-xs text-muted">
                    {canSwitch
                      ? "Every card on the dashboard reads the active home."
                      : "This is the only home on your account."}
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

                {archiveTarget !== null ? (
                  <ArchiveConfirmPanel
                    target={
                      properties.find((p) => p.id === archiveTarget) ?? null
                    }
                    isLastHome={properties.length === 1}
                    isActive={archiveTarget === active.id}
                    error={archiveError}
                    pending={archivePending}
                    onCancel={handleArchiveCancel}
                    onConfirm={handleArchiveConfirm}
                  />
                ) : (
                  <>
                    {canSwitch && (
                      <>
                        <RadioGroup
                          aria-label="Active home"
                          value={switchTarget}
                          onChange={setSwitchTarget}
                          className="flex flex-col gap-2"
                        >
                          {properties.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-start justify-between gap-2"
                            >
                              <Radio value={p.id} className="flex-1 min-w-0">
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
                              {/* Archive trigger. Radio + Button are
                                  siblings so the button click doesn't
                                  also toggle the radio — putting the
                                  button inside the Radio's label makes
                                  the whole row selectable for the
                                  trash icon's hit area, which is the
                                  wrong affordance. */}
                              <Button
                                variant="tertiary"
                                size="sm"
                                aria-label={`Archive ${p.label || "this home"}`}
                                onPress={() => handleArchiveRequest(p.id)}
                                className="shrink-0"
                              >
                                <TrashBin aria-hidden className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </RadioGroup>

                        <div className="flex justify-end">
                          <Button
                            variant="tertiary"
                            size="sm"
                            onPress={handleSwitch}
                            isDisabled={
                              switchTarget === active.id || switchPending
                            }
                          >
                            {switchPending ? "Switching…" : "Switch home"}
                          </Button>
                        </div>
                      </>
                    )}

                    {/* Single-home users also need the archive trigger —
                        without it a customer who typo'd their address on
                        the only home has no way to remove it and start
                        fresh short of contacting support. */}
                    {!canSwitch && (
                      <div className="flex items-start justify-between gap-2 rounded-xl bg-surface px-3 py-2.5">
                        <div className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <span className="truncate">
                              {active.label || "Untitled home"}
                            </span>
                            <Chip color="success" variant="soft" size="sm">
                              Active
                            </Chip>
                          </span>
                          <span className="truncate text-xs text-muted">
                            {active.address}
                            {active.postcode ? ` · ${active.postcode}` : ""}
                          </span>
                        </div>
                        <Button
                          variant="tertiary"
                          size="sm"
                          aria-label={`Archive ${active.label || "this home"}`}
                          onPress={() => handleArchiveRequest(active.id)}
                          className="shrink-0"
                        >
                          <TrashBin aria-hidden className="size-4" />
                        </Button>
                      </div>
                    )}

                    {/* Add-another-home entry point. Modelled on mobile's
                        "Add another address" row rather than a floating
                        button — inline placement keeps it obviously part
                        of the same home-management surface.
                        Disabled once the account is at the backend's
                        property cap (`MAX_PROPERTIES_PER_USER`), with
                        the button label saying WHY so the greyed state
                        isn't silent — an amber upsell would be
                        misleading here since there's nothing the user
                        can do short of archiving. */}
                    <div className="flex flex-col gap-1 border-t border-default-200 pt-3">
                      <Button
                        variant="tertiary"
                        size="sm"
                        isDisabled={
                          properties.length >= MAX_PROPERTIES_PER_USER
                        }
                        onPress={() => {
                          overlay.close();
                          router.push("/onboarding/address?flow=add-property");
                        }}
                        className="justify-start"
                      >
                        <Plus aria-hidden className="mr-2 inline size-4" />
                        {properties.length >= MAX_PROPERTIES_PER_USER
                          ? `Max of ${MAX_PROPERTIES_PER_USER} homes reached`
                          : "Add another home"}
                      </Button>
                      {properties.length >= MAX_PROPERTIES_PER_USER && (
                        <p className="text-xs text-muted">
                          Archive a home to add a new one.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
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

/**
 * Inline confirmation for archiving a home. Rendered inside the "Your
 * homes" section rather than as a stacked AlertDialog because HeroUI's
 * dialogs don't compose cleanly when one is already on screen — the
 * focus trap of the outer dialog fights the inner one and the archive
 * "Cancel" button often can't take focus without a second Tab.
 *
 * Reads as its own view of the section: header + body + two-button
 * footer. The rest of the section is hidden while this shows, so a
 * user can't accidentally hit "Switch home" or the trash icon on a
 * different row mid-confirm.
 *
 * ### Empty-target defence
 *
 * `target === null` means the caller's `archiveTarget` id didn't match
 * any current home — a race we shouldn't see in practice, but if the
 * property list refreshed between the trash click and the render, the
 * panel would otherwise crash on `target.label`. Render a plain
 * "Home no longer available" and force Cancel; the parent's state
 * reset drops the row.
 */
function ArchiveConfirmPanel({
  target,
  isLastHome,
  isActive,
  error,
  pending,
  onCancel,
  onConfirm,
}: {
  target: ActiveProperty | null;
  isLastHome: boolean;
  isActive: boolean;
  error: string | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (target === null) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          That home is no longer available. It may have been archived from
          another tab.
        </p>
        <div className="flex justify-end">
          <Button variant="tertiary" size="sm" onPress={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          Archive &ldquo;{target.label || "Untitled home"}&rdquo;?
        </p>
        <p className="text-xs text-muted">
          {target.address}
          {target.postcode ? ` · ${target.postcode}` : ""}
        </p>
      </div>
      <p className="text-xs text-muted">
        Historical readings are kept in your account, but this home no
        longer appears in your list.{" "}
        {isLastHome
          ? "This is your only home — after archiving, you'll be asked to add a new one before the dashboard loads."
          : isActive
            ? "The dashboard will re-scope to another of your homes."
            : "The active home stays as it is."}
      </p>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="tertiary" size="sm" onPress={onCancel} isDisabled={pending}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onPress={onConfirm}
          isDisabled={pending}
        >
          {pending ? "Archiving…" : "Archive"}
        </Button>
      </div>
    </div>
  );
}
