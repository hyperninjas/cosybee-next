"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Accordion,
  Alert,
  Button,
  Chip,
  Description,
  Label,
  ListBox,
  Modal,
  SearchField,
  Separator,
  Spinner,
} from "@heroui/react";
import {
  ArrowsRotateLeft,
  ChevronDown,
  ChevronRight,
  LinkSlash,
  Sun,
} from "@gravity-ui/icons";
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
 *     inverter's readings, so the warning sits above the list, where it
 *     is read BEFORE the tap that applies the change.
 *
 * Kept in `sections/manage/` — same rationale as `sections/connect/`: the
 * lifecycle actions cluster by domain, not by dashboard slot, and any card
 * that wants to expose them just imports the modal.
 *
 * ### Design notes
 *
 *   • The menu is a HeroUI `ListBox` with `selectionMode="none"` +
 *     `onAction` — the library's own action-menu pattern, with
 *     `variant="danger"` carrying the destructive tint. It replaced two
 *     hand-rolled `<button>` cards that re-implemented hover, focus and
 *     danger styling by hand and picked up none of the keyboard
 *     behaviour (arrow keys, typeahead) a listbox gives for free.
 *   • Tints come from HeroUI tokens. The header icon and the selected
 *     inverter row both reached for `var(--efh-solar)`, which is scoped
 *     to `.efh-scope` in globals.css — this dialog portals to
 *     `document.body`, outside that scope, so the header icon rendered
 *     on a blank square and the selected row got no highlight at all.
 *   • Status feedback is `Alert`, matching the connect dialogs.
 *   • The inverter picker is a sectioned `ListBox` — one plant per
 *     section, one tap to apply. It replaced a `RadioGroup` wrapped
 *     around an `Accordion`: every plant was collapsed, so reaching any
 *     inverter took two clicks and a third on a submit button, and a
 *     screen full of chevrons showed no inverters at all.
 *   • Applying on tap is the product decision here; the confirm step is
 *     gone. Plants with no inverters are dropped rather than rendered as
 *     un-openable rows, and the currently-linked inverter is disabled —
 *     switching to what you are already on is a no-op that would still
 *     bin your history.
 */

type View = "menu" | "disconnect" | "switch";

interface Props {
  children: ReactNode;
  /**
   * Rendered next to the modal title so the user is sure they're managing
   * the right home when the account has more than one linked property.
   */
  propertyLabel?: string | null;
  /**
   * Most recent error the sync job wrote to `SunsynkConnection.lastError`
   * (from eb-auth's `markConnectionError` — the failed-fetch branch of
   * `syncTelemetryForConnection`). Historically stored, never surfaced,
   * which meant a customer whose sync had been silently failing for days
   * had NO way to see why beyond DB inspection.
   *
   * `null` when the last sync succeeded (`markConnectionSynced` clears the
   * column). Any non-null value is a real message from the sync path and
   * gets rendered verbatim — messages come from the backend's own error
   * mapper, which is careful not to leak credentials.
   */
  lastError?: string | null;
  /**
   * Plant name + inverter serial that the connection row currently points
   * at — shown inside the "Currently reading" summary so a customer with
   * more than one plant on their Sunsynk account can spot when the wrong
   * one is picked WITHOUT having to open the Switch-inverter picker.
   * `null` on a half-linked connection (OAuth done, no plant selected).
   */
  linkedPlantId?: string | null;
  linkedInverterSerial?: string | null;
}

export function ManageSunSyncModal({
  children,
  propertyLabel,
  lastError,
  linkedPlantId,
  linkedInverterSerial,
}: Props) {
  const [view, setView] = useState<View>("menu");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Switch-inverter picker state
  const [plants, setPlants] = useState<LinkedPlant[] | null>(null);
  // "plantId::serial" of the row currently being applied, so that row can
  // show a spinner while every other row locks.
  const [switching, setSwitching] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Which accordion panels are open. Controlled so a search query can
  // expand every matching plant automatically instead of forcing the user
  // to open each one after typing.
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(
    new Set(),
  );

  // Plants with no inverters can't be switched to — the API still lists
  // them, but as rows they're dead weight.
  const plantsWithInverters =
    plants?.filter((p) => p.inverters.length > 0) ?? null;

  // Filter by plant label OR serial, case-insensitive. The linked
  // inverter stays inside its plant — the accordion trigger carries the
  // "Linked" chip so the plant is easy to spot without pinning a
  // duplicate section above the list.
  const filteredPlants = useMemo(() => {
    if (!plantsWithInverters) return null;
    const q = query.trim().toLowerCase();
    if (!q) return plantsWithInverters;
    return plantsWithInverters
      .map((p) => {
        const plantMatches = p.label.toLowerCase().includes(q);
        // If the plant name matches, keep all its inverters — the user
        // was looking for the plant, not narrowing within it.
        const matched = plantMatches
          ? p.inverters
          : p.inverters.filter(
              (i) =>
                i.serial.toLowerCase().includes(q) ||
                i.label.toLowerCase().includes(q),
            );
        return { ...p, inverters: matched };
      })
      .filter((p) => p.inverters.length > 0);
  }, [plantsWithInverters, query]);

  // Load the plant list when the user enters the switch view. Runs client-
  // side (Server Action call) so the dialog can open instantly on the menu
  // view without the network round-trip if the user only wants to disconnect.
  // The plant holding the currently-linked inverter is auto-expanded here
  // (in the same tick as the setPlants) so the user lands on the row
  // they'd want to keep or switch away from without a manual click, and
  // there's no cascading render from a follow-up effect.
  useEffect(() => {
    if (view !== "switch" || plants !== null) return;
    void (async () => {
      const result = await listSunSyncPlants();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPlants(result.plants);
      const linkedPlantId = result.plants.find((p) =>
        p.inverters.some((i) => i.isCurrent),
      )?.id;
      if (linkedPlantId) setExpandedKeys(new Set([linkedPlantId]));
    })();
  }, [view, plants]);

  /**
   * Merges the query filter with the accordion state: every plant that
   * survives the filter is auto-opened while the user is typing so the
   * matched inverters are visible without a follow-up click on each
   * plant. Clearing the query leaves the current expansion state alone —
   * the user's original picks are preserved.
   */
  function handleQueryChange(next: string) {
    setQuery(next);
    if (next.trim() && filteredPlants) {
      setExpandedKeys(new Set(filteredPlants.map((p) => p.id)));
    }
  }

  function reset() {
    setView("menu");
    setError(null);
    setSwitching(null);
    setQuery("");
    setExpandedKeys(new Set());
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

  /**
   * Applied straight from the tap — there is no confirm step, so the
   * warning above the list is the last thing read before this fires.
   */
  function handleSwitch(id: string) {
    setError(null);
    const [plantId, inverterSerial] = id.split("::");
    if (!plantId || !inverterSerial) {
      setError("Invalid selection.");
      return;
    }
    setSwitching(id);
    startTransition(async () => {
      const result = await switchSunSyncSelection({
        plantId,
        inverterSerial,
        confirmDiscardHistory: true,
      });
      setSwitching(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // 🔴 Optimistic cache update — the "Linked" chip must move HERE.
      //
      // `plants` is client-cached across the modal's lifetime (see the
      // "Keep `plants` cached" note in `reset()` — reopening the modal
      // does not refetch). `revalidatePath("/dashboard")` inside
      // `switchSunSyncSelection` invalidates the SERVER-rendered
      // dashboard, but this list came from a Server Action call in a
      // `useEffect`, which `revalidatePath` cannot reach. Without this
      // patch a user who switched to a new inverter and then went back
      // into the switch view (or just glanced at the list before
      // navigating away) still saw the OLD inverter labelled "Linked",
      // which reads as "the change didn't take" — reported 2026-09-21.
      //
      // The backend has already confirmed the switch with `ok: true`,
      // so mirroring the flip locally is safe: we're not guessing at
      // upstream state, we're propagating the state we just wrote.
      setPlants((prev) =>
        prev?.map((p) => ({
          ...p,
          inverters: p.inverters.map((inv) => ({
            ...inv,
            isCurrent: p.id === plantId && inv.serial === inverterSerial,
          })),
        })) ?? null,
      );
      reset();
    });
  }

  return (
    <Modal>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop variant="blur">
        {/* The switch view holds an accordion of every plant on the
            account, so it earns the wider dialog; the other two views are
            a short list and a yes/no question. */}
        <Modal.Container
          size={view === "switch" ? "lg" : "md"}
          placement="center"
          scroll="inside"
        >
          <Modal.Dialog>
            <Modal.Header className="flex-row items-center gap-3 pe-10">
              <Modal.Icon className="size-12 bg-warning-soft text-warning-soft-foreground">
                <Sun aria-hidden className="size-7" />
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
                <p className="mt-1 text-sm leading-5 text-muted">
                  {view === "menu" && "Choose what to change."}
                  {view === "disconnect" &&
                    "The dashboard stops receiving live power flow."}
                  {view === "switch" && "Pick the inverter to read from."}
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              {error && (
                <Alert status="danger" className="mb-4">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}

              {/* Diagnostic panel — only rendered on the menu view so it
                  frames the first thing the user sees when opening the
                  dialog to figure out "why isn't this working?". Two
                  independent pieces of information:
                    • A red alert with `lastError` — the exact upstream
                      message from the last failed sync, when there is one.
                    • A neutral summary of what the connection is CURRENTLY
                      pointed at — plant name + serial, so a user can
                      cross-check against Sunsynk's own portal without
                      having to open the Switch-inverter picker.
                  Both stay out of the switch and disconnect views so those
                  flows aren't cluttered. */}
              {view === "menu" && (lastError || linkedInverterSerial) && (
                <div className="mb-4 flex flex-col gap-3">
                  {lastError && (
                    <Alert status="danger">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>Last sync failed</Alert.Title>
                        <Alert.Description>{lastError}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}
                  {linkedInverterSerial && (
                    <div className="rounded-2xl bg-surface-secondary px-4 py-3">
                      <p className="text-xs font-medium text-muted">
                        Currently reading
                      </p>
                      <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                        Plant{linkedPlantId ? ` · ${linkedPlantId}` : ""}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted">
                        Inverter {linkedInverterSerial}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {view === "menu" && (
                <ListBox
                  aria-label="Sunsynk actions"
                  selectionMode="none"
                  onAction={(key) => setView(key as View)}
                  className="rounded-2xl border border-border bg-surface shadow-xs"
                >
                  <ListBox.Item id="switch" textValue="Switch inverter">
                    <ArrowsRotateLeft
                      aria-hidden
                      className="size-4 shrink-0 text-muted"
                    />
                    <div className="flex flex-col">
                      <Label>Switch inverter</Label>
                      <Description>
                        Pick a different plant or inverter on this account.
                      </Description>
                    </div>
                    <ChevronRight
                      aria-hidden
                      className="ms-auto size-4 shrink-0 text-muted"
                    />
                  </ListBox.Item>
                  <Separator />
                  <ListBox.Item
                    id="disconnect"
                    textValue="Disconnect Sunsynk"
                    variant="danger"
                  >
                    <LinkSlash
                      aria-hidden
                      className="size-4 shrink-0 text-danger"
                    />
                    <div className="flex flex-col">
                      <Label>Disconnect Sunsynk</Label>
                      <Description>
                        Stop live sync. Historical readings kept.
                      </Description>
                    </div>
                    <ChevronRight
                      aria-hidden
                      className="ms-auto size-4 shrink-0 text-danger"
                    />
                  </ListBox.Item>
                </ListBox>
              )}

              {/* No nested danger panel — the dialog, its heading and the
                  red confirm button already carry the warning. */}
              {view === "disconnect" && (
                <p className="text-sm leading-6 text-muted">
                  Your historical readings stay in your account, and
                  reconnecting later restores live sync.
                </p>
              )}

              {view === "switch" && (
                <div className="flex flex-col gap-4">
                  {/* Above the list, because a tap applies immediately —
                      but one muted line, not a boxed Alert. Three lines of
                      amber panel pushed the actual list below the fold. */}
                  <p className="text-xs leading-5 text-muted">
                    Applies right away, and clears stored history for the
                    inverter you&apos;re on now.
                  </p>

                  {plantsWithInverters === null && (
                    <div
                      role="status"
                      className="flex items-center gap-3 rounded-2xl bg-surface-secondary px-4 py-6"
                    >
                      <Spinner size="sm" />
                      <p className="text-sm text-muted">
                        Loading your Sunsynk plants…
                      </p>
                    </div>
                  )}

                  {plantsWithInverters !== null &&
                    plantsWithInverters.length === 0 && (
                      <p className="rounded-2xl bg-surface-secondary px-4 py-6 text-center text-sm text-muted">
                        No other inverters on this Sunsynk account.
                      </p>
                    )}

                  {plantsWithInverters !== null &&
                    plantsWithInverters.length > 0 && (
                      <>
                        {/* Search kicks in once there's enough to scroll —
                            below that threshold it's just a target the eye
                            has to skip over on the way to the list. */}
                        {plantsWithInverters.reduce(
                          (n, p) => n + p.inverters.length,
                          0,
                        ) > 4 && (
                          <SearchField
                            aria-label="Filter inverters"
                            value={query}
                            onChange={handleQueryChange}
                            variant="secondary"
                            fullWidth
                          >
                            <SearchField.Group>
                              <SearchField.SearchIcon />
                              <SearchField.Input placeholder="Search by plant or serial…" />
                              <SearchField.ClearButton />
                            </SearchField.Group>
                          </SearchField>
                        )}

                        {/* Bounded height + overflow because HeroUI Modal's
                            `scroll="inside"` sets overflow on Modal.Body but
                            never gives it a height, so a long account pushed
                            the footer off-screen with no scrollbar. */}
                        <div className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain">
                          {filteredPlants && filteredPlants.length === 0 ? (
                            <p className="rounded-2xl bg-surface-secondary px-4 py-6 text-center text-sm text-muted">
                              {query
                                ? `No inverters match “${query}”.`
                                : "No other inverters on this Sunsynk account."}
                            </p>
                          ) : (
                            <Accordion
                              variant="surface"
                              allowsMultipleExpanded
                              expandedKeys={expandedKeys}
                              onExpandedChange={setExpandedKeys}
                              className="w-full"
                            >
                              {filteredPlants?.map((plant) => {
                                const holdsLinked = plant.inverters.some(
                                  (i) => i.isCurrent,
                                );
                                return (
                                  <Accordion.Item
                                    key={plant.id}
                                    id={plant.id}
                                    isDisabled={pending}
                                  >
                                    <Accordion.Heading>
                                      <Accordion.Trigger>
                                        <span className="me-3 flex min-w-0 flex-1 items-center gap-2">
                                          <span className="truncate font-medium text-foreground">
                                            {plant.label}
                                          </span>
                                          {holdsLinked && (
                                            <Chip
                                              color="success"
                                              variant="soft"
                                              size="sm"
                                              className="shrink-0"
                                            >
                                              Linked
                                            </Chip>
                                          )}
                                        </span>
                                        <Chip
                                          color="default"
                                          variant="soft"
                                          size="sm"
                                          className="me-3 shrink-0"
                                        >
                                          {plant.inverters.length}{" "}
                                          {plant.inverters.length === 1
                                            ? "inverter"
                                            : "inverters"}
                                        </Chip>
                                        <Accordion.Indicator>
                                          <ChevronDown />
                                        </Accordion.Indicator>
                                      </Accordion.Trigger>
                                    </Accordion.Heading>
                                    <Accordion.Panel>
                                      <Accordion.Body className="pt-0 pb-2">
                                        <ul className="flex flex-col gap-1">
                                          {plant.inverters.map((inv) => (
                                            <li key={inv.serial}>
                                              <InverterRow
                                                plantId={plant.id}
                                                plantLabel={plant.label}
                                                inverter={inv}
                                                switching={switching}
                                                pending={pending}
                                                onSelect={handleSwitch}
                                              />
                                            </li>
                                          ))}
                                        </ul>
                                      </Accordion.Body>
                                    </Accordion.Panel>
                                  </Accordion.Item>
                                );
                              })}
                            </Accordion>
                          )}
                        </div>
                      </>
                    )}
                </div>
              )}

            </Modal.Body>

            <Modal.Footer>
              {view === "menu" && (
                <Button slot="close" variant="tertiary">
                  Close
                </Button>
              )}
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
            </Modal.Footer>

            {/* Last child on purpose. React Aria focuses the first tabbable
                element when the dialog opens — with the close button first
                in the DOM, opening the modal parked a focus ring on the X.
                Now focus lands on the action list, where arrow keys and
                typeahead work straight away. */}
            <Modal.CloseTrigger />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

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

/**
 * A single inverter row inside an expanded accordion panel. Plain
 * `<button>` on purpose — nesting HeroUI's `ListBox` inside an
 * `Accordion.Body` blanks the item labels (react-aria's collection
 * builder doesn't like the wrapper), and a button hands us complete
 * control over layout and the disabled/current tint without fighting
 * that. Keyboard access is intact: tab moves between rows and Enter
 * triggers the click.
 */
interface InverterRowProps {
  plantId: string;
  plantLabel: string;
  inverter: LinkedPlant["inverters"][number];
  switching: string | null;
  pending: boolean;
  onSelect: (id: string) => void;
}

function InverterRow({
  plantId,
  plantLabel,
  inverter,
  switching,
  pending,
  onSelect,
}: InverterRowProps) {
  const id = `${plantId}::${inverter.serial}`;
  const { serial, status, isOnline } = parseInverterLabel(inverter.label);
  const isSwitching = switching === id;
  const isCurrent = inverter.isCurrent;
  const isDisabled = pending || isCurrent;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      disabled={isDisabled}
      aria-label={`${plantLabel} ${serial}${isCurrent ? " (currently linked)" : ""}`}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${
        isCurrent
          ? "bg-success-soft/50 ring-1 ring-inset ring-success/30"
          : isDisabled
            ? "opacity-60"
            : "hover:bg-hover"
      }`}
    >
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${
          isOnline ? "bg-success" : "bg-muted/50"
        }`}
      />
      <span className="truncate font-mono text-[13px] text-foreground">
        {serial}
      </span>
      {isSwitching ? (
        <Spinner size="sm" className="ms-auto" />
      ) : isCurrent ? (
        <Chip
          color="success"
          variant="soft"
          size="sm"
          className="ms-auto shrink-0"
        >
          Linked
        </Chip>
      ) : (
        <Chip
          color={isOnline ? "success" : "default"}
          variant="soft"
          size="sm"
          className="ms-auto shrink-0"
        >
          {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
        </Chip>
      )}
    </button>
  );
}


