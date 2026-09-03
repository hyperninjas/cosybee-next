"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import {
  Accordion,
  Button,
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

  // Plant ID that holds the currently-linked inverter — used to auto-expand
  // the matching accordion item so the user sees which node they're moving
  // away from without clicking through every group.
  const currentPlantId =
    plants?.find((p) => p.inverters.some((i) => i.isCurrent))?.id ?? null;

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
        <Modal.Container size="lg" placement="center" scroll="inside">
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
                    // One RadioGroup wraps the whole Accordion so radios in
                    // any expanded panel share the same selection state (a
                    // pick in one plant deselects a pick in another). The
                    // plant containing the currently-linked inverter is
                    // expanded by default so the user immediately sees
                    // which node they're moving away from.
                    //
                    // Explicit max-height + overflow-y-auto around the
                    // Accordion because HeroUI Modal's `scroll="inside"`
                    // only sets `overflow-y-auto` on Modal.Body — it doesn't
                    // give Body a bounded height, so the modal grew past
                    // the viewport on accounts with many plants (footer
                    // pushed off-screen, no scrollbar). A hard max-height
                    // here scrolls the Accordion inline while the footer
                    // stays visible below.
                    <RadioGroup
                      aria-label="Inverter"
                      value={selectedInverter ?? ""}
                      onChange={setSelectedInverter}
                      className="max-h-[min(60vh,32rem)] overflow-y-auto overscroll-contain rounded-md border border-separator"
                    >
                      <Accordion
                        variant="default"
                        defaultExpandedKeys={
                          currentPlantId ? [currentPlantId] : []
                        }
                      >
                        {plants.map((plant) => {
                          const currentCount = plant.inverters.filter(
                            (i) => i.isCurrent,
                          ).length;
                          return (
                            <Accordion.Item key={plant.id} id={plant.id}>
                              <Accordion.Heading>
                                <Accordion.Trigger className="flex w-full items-center justify-between gap-3 py-3 text-left">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                      {plant.label}
                                    </span>
                                    <span className="text-xs text-muted">
                                      {plant.inverters.length}{" "}
                                      {plant.inverters.length === 1
                                        ? "inverter"
                                        : "inverters"}
                                    </span>
                                    {currentCount > 0 && (
                                      <Chip
                                        color="success"
                                        variant="soft"
                                        size="sm"
                                      >
                                        Current
                                      </Chip>
                                    )}
                                  </span>
                                  <Accordion.Indicator />
                                </Accordion.Trigger>
                              </Accordion.Heading>
                              <Accordion.Panel>
                                <Accordion.Body className="flex flex-col gap-1 pb-3">
                                  {plant.inverters.map((inv) => (
                                    <InverterPickerRow
                                      key={`${plant.id}::${inv.serial}`}
                                      value={`${plant.id}::${inv.serial}`}
                                      label={inv.label}
                                      isCurrent={inv.isCurrent}
                                    />
                                  ))}
                                </Accordion.Body>
                              </Accordion.Panel>
                            </Accordion.Item>
                          );
                        })}
                      </Accordion>
                    </RadioGroup>
                  )}
                  {/* Warning as pure informational text — clicking the
                      "Switch inverter" button IS the confirmation. The
                      earlier "check this box, then click the button"
                      pattern gated one decision behind two steps and
                      surfaced a redundant "please confirm" error when
                      users clicked the button without checking. The
                      backend still requires `confirmDiscardHistory: true`;
                      that's now sent unconditionally on submit. */}
                  <div className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2.5 text-xs text-warning-foreground">
                    <span aria-hidden="true">⚠️</span>
                    <span>
                      Switching inverters discards this home&apos;s stored
                      readings, daily totals and intraday ledger for the
                      currently linked inverter.
                    </span>
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
 * One inverter row in the switch picker. Mirrors the `PickerRow` composition
 * in `ConnectSunSyncModal` — Radio.Control renders the actual radio dial and
 * the whole card is the hit target, so a tap anywhere on the row selects it.
 * Without this the bare `<Radio>{children}</Radio>` renders nothing visible
 * to click.
 */
/**
 * Splits the backend's `<serial> (online|offline)` label into its parts so
 * the row can style the status as a small coloured dot next to the serial
 * instead of raw text-in-parens. Anything that doesn't match the pattern
 * falls through unchanged — the row still displays the raw label.
 */
function parseInverterLabel(label: string): {
  serial: string;
  status: string | null;
  isOnline: boolean;
} {
  const match = /^(.+?)\s*\((online|offline)\)\s*$/i.exec(label);
  if (!match) return { serial: label, status: null, isOnline: false };
  const status = match[2]!.toLowerCase();
  return { serial: match[1]!, status, isOnline: status === "online" };
}

function InverterPickerRow({
  value,
  label,
  isCurrent,
}: {
  value: string;
  /** Already formatted as `<serial> (online|offline)` — matches onboarding. */
  label: string;
  isCurrent: boolean;
}) {
  const { serial, status, isOnline } = parseInverterLabel(label);
  // Borderless row: the row itself is `flex items-center gap-3` (matching
  // HeroUI's `.radio` default so the dial + content sit tight next to
  // each other, not with a stretched flex-1 gap). Serial + status pill
  // group hugs the left; a `Currently linked` chip when present pushes
  // to the right via `ml-auto`.
  return (
    <Radio
      value={value}
      className="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-secondary data-[selected=true]:bg-[color:var(--efh-solar)]/10"
    >
      <Radio.Control>
        <Radio.Indicator />
      </Radio.Control>
      {/* HeroUI's `.radio__content` defaults to `flex flex-col gap-0`, so
          a className overriding to horizontal via just `flex items-center`
          gets tailwind-merged AWAY (no explicit `flex-row` to displace
          `flex-col`). Wrapping in an inner div sidesteps that entirely
          and pins the layout — Radio.Content just holds one full-width
          child, and the inner div owns the row layout. */}
      <Radio.Content className="w-full min-w-0 flex-1">
        <div className="flex w-full items-center gap-3">
          <span className="truncate font-mono text-[13px] text-foreground">
            {serial}
          </span>
          {status && (
            <span
              className={`inline-flex shrink-0 items-center gap-1 text-[11px] ${
                isOnline ? "text-success" : "text-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block size-1.5 rounded-full ${
                  isOnline ? "bg-success" : "bg-muted-foreground"
                }`}
              />
              {status}
            </span>
          )}
          {isCurrent && (
            <Chip color="success" variant="soft" size="sm" className="ml-auto shrink-0">
              Currently linked
            </Chip>
          )}
        </div>
      </Radio.Content>
    </Radio>
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
