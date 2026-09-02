"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import {
  Button,
  Checkbox,
  Chip,
  Modal,
  Radio,
  RadioGroup,
} from "@heroui/react";
import { Sun } from "@gravity-ui/icons";
import {
  disconnectSunSync,
  listSunSyncPlants,
  switchSunSyncSelection,
  type LinkedPlant,
  type ProviderActionResult,
} from "@/app/lib/provider-actions";

/**
 * Post-connect management dialog for SunSync. Two actions live behind one
 * modal so the ProviderStatusBar row only needs a single "Manage" trigger:
 *
 *   • Disconnect — unlink the SunSync account (historical readings stay).
 *   • Switch inverter — repoint to a different plant/inverter on the SAME
 *     linked account. Destructive: the backend deletes the previous
 *     inverter's readings, so the user must tick a consent box before the
 *     action fires (mirrors `confirmDiscardHistory` on the endpoint).
 *
 * Kept in `sections/manage/` — same rationale as `sections/connect/`: the
 * lifecycle actions cluster by domain, not by dashboard slot, and any card
 * that wants to expose them just imports the modal.
 */

type View = "menu" | "disconnect" | "switch";

interface Props {
  children: ReactNode;
  /**
   * Rendered next to the modal title so the user is sure they're managing
   * the right home when the account has more than one linked property.
   */
  propertyLabel?: string | null;
}

export function ManageSunSyncModal({ children, propertyLabel }: Props) {
  const [view, setView] = useState<View>("menu");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Switch-inverter picker state
  const [plants, setPlants] = useState<LinkedPlant[] | null>(null);
  const [selectedInverter, setSelectedInverter] = useState<string | null>(null); // "plantId::serial"
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Load the plant list when the user enters the switch view. Runs client-
  // side (Server Action call) so the dialog can open instantly on the menu
  // view without the network round-trip if the user only wants to disconnect.
  useEffect(() => {
    if (view !== "switch" || plants !== null) return;
    void (async () => {
      const result = await listSunSyncPlants();
      if (result.ok) {
        setPlants(result.plants);
        // Pre-select the currently active inverter so the picker isn't empty
        // and the user can see which one they're moving AWAY from.
        for (const plant of result.plants) {
          const current = plant.inverters.find((i) => i.isCurrent);
          if (current) {
            setSelectedInverter(`${plant.id}::${current.serial}`);
            break;
          }
        }
      } else {
        setError(result.error);
      }
    })();
  }, [view, plants]);

  function reset() {
    setView("menu");
    setError(null);
    setSelectedInverter(null);
    setConfirmDiscard(false);
    // Keep `plants` cached — reopening the modal doesn't need a refetch.
  }

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      const result: ProviderActionResult = await disconnectSunSync();
      if (!result.ok) setError(result.error);
      // On success, revalidatePath in the action closes the connected tier
      // for real. Reset the dialog so if the user reopens for any reason
      // (fast connect + reopen), it starts fresh.
      else reset();
    });
  }

  function handleSwitch() {
    setError(null);
    if (!selectedInverter) {
      setError("Pick an inverter first.");
      return;
    }
    if (!confirmDiscard) {
      setError("Confirm that the previous inverter's history will be discarded.");
      return;
    }
    const [plantId, inverterSerial] = selectedInverter.split("::");
    if (!plantId || !inverterSerial) {
      setError("Invalid selection.");
      return;
    }
    startTransition(async () => {
      const result = await switchSunSyncSelection({
        plantId,
        inverterSerial,
        confirmDiscardHistory: true,
      });
      if (!result.ok) setError(result.error);
      else reset();
    });
  }

  return (
    <Modal>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog>
            <Modal.Header className="flex-row items-start gap-3">
              <Modal.Icon className="bg-[color:var(--efh-solar)]/10 text-[color:var(--efh-solar)]">
                <Sun className="size-5" />
              </Modal.Icon>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Modal.Heading>Manage Sunsynk</Modal.Heading>
                  {propertyLabel && (
                    <Chip color="default" variant="soft" size="sm">
                      {propertyLabel}
                    </Chip>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {view === "menu" &&
                    "Disconnect this Sunsynk account or switch to a different inverter on the same account."}
                  {view === "disconnect" &&
                    "This unlinks the Sunsynk account from this home. Historical readings stay in your account — reconnecting later restores live sync."}
                  {view === "switch" &&
                    "Repoint the dashboard at a different inverter on this Sunsynk account. No password re-entry needed."}
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
                >
                  {error}
                </div>
              )}

              {view === "menu" && (
                <div className="flex flex-col gap-3">
                  <ActionRow
                    label="Switch inverter"
                    description="Pick a different plant or inverter on this Sunsynk account."
                    onSelect={() => setView("switch")}
                  />
                  <ActionRow
                    label="Disconnect Sunsynk"
                    description="Stop live sync. Historical readings kept."
                    danger
                    onSelect={() => setView("disconnect")}
                  />
                </div>
              )}

              {view === "disconnect" && (
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                  <p className="font-semibold">Disconnect this Sunsynk account?</p>
                  <p className="mt-1 text-danger/80">
                    The dashboard will stop receiving live power flow. Historical
                    readings stay in your account and are restored if you reconnect
                    later.
                  </p>
                </div>
              )}

              {view === "switch" && (
                <div className="flex flex-col gap-4">
                  {plants === null && (
                    <p className="text-sm text-muted">Loading your Sunsynk plants…</p>
                  )}
                  {plants !== null && plants.length === 0 && (
                    <p className="text-sm text-muted">
                      No plants found on this Sunsynk account.
                    </p>
                  )}
                  {plants !== null && plants.length > 0 && (
                    <RadioGroup
                      aria-label="Inverter"
                      value={selectedInverter ?? ""}
                      onChange={setSelectedInverter}
                      className="flex flex-col gap-4"
                    >
                      {plants.map((plant) => (
                        <fieldset
                          key={plant.id}
                          className="rounded-lg border border-border bg-surface-secondary p-4"
                        >
                          <legend className="px-2 text-sm font-semibold text-foreground">
                            {plant.label}
                          </legend>
                          <div className="mt-2 flex flex-col gap-2">
                            {plant.inverters.map((inv) => (
                              <Radio
                                key={`${plant.id}::${inv.serial}`}
                                value={`${plant.id}::${inv.serial}`}
                              >
                                <span className="mr-2">{inv.label}</span>
                                {inv.isCurrent && (
                                  <Chip color="success" variant="soft" size="sm">
                                    Currently linked
                                  </Chip>
                                )}
                              </Radio>
                            ))}
                          </div>
                        </fieldset>
                      ))}
                    </RadioGroup>
                  )}
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                    <Checkbox
                      isSelected={confirmDiscard}
                      onChange={setConfirmDiscard}
                    >
                      I understand switching inverters discards this home's stored
                      readings, daily totals, and intraday ledger for the currently
                      linked inverter.
                    </Checkbox>
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              {view === "menu" && <Modal.CloseTrigger />}
              {view !== "menu" && (
                <Button variant="tertiary" onPress={reset} isDisabled={pending}>
                  Back
                </Button>
              )}
              {view === "disconnect" && (
                <Button
                  variant="danger"
                  onPress={handleDisconnect}
                  isDisabled={pending}
                >
                  {pending ? "Disconnecting…" : "Disconnect"}
                </Button>
              )}
              {view === "switch" && (
                <Button
                  variant="primary"
                  onPress={handleSwitch}
                  isDisabled={pending || plants === null}
                >
                  {pending ? "Switching…" : "Switch inverter"}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

/**
 * A menu-style row inside the modal body. Full-width, hover state, right-side
 * chevron implied by the "danger" red tint for destructive actions.
 */
function ActionRow({
  label,
  description,
  onSelect,
  danger,
}: {
  label: string;
  description: string;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition hover:border-primary/60 ${
        danger
          ? "border-danger/30 bg-danger/5 hover:bg-danger/10"
          : "border-border bg-surface"
      }`}
    >
      <span
        className={`text-sm font-semibold ${danger ? "text-danger" : "text-foreground"}`}
      >
        {label}
      </span>
      <span className="text-xs text-muted">{description}</span>
    </button>
  );
}
