"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Input,
  Modal,
  Popover,
  Table,
} from "@heroui/react";
import {
  LayoutColumns,
  Pencil,
  StarFill,
  TrashBin,
  Xmark,
} from "@gravity-ui/icons";
import type {
  TariffDTO,
  TariffRegionDTO,
  TariffRegionRateDTO,
  TariffRegionRateInput,
} from "../lib/api";
import { saveTariffRatesAction } from "./actions";

/**
 * The nine editable rate columns, grouped for the side panel. `short` labels
 * the dense table header; `label`/`hint` label the panel inputs.
 */
const COLS = [
  {
    key: "elecUnit",
    short: "Elec unit",
    label: "Unit rate",
    hint: "p/kWh",
    group: "Electricity",
  },
  {
    key: "elecStanding",
    short: "Elec SC",
    label: "Standing charge",
    hint: "p/day",
    group: "Electricity",
  },
  {
    key: "e7Day",
    short: "E7 day",
    label: "Day rate",
    hint: "p/kWh",
    group: "Economy 7",
  },
  {
    key: "e7Night",
    short: "E7 night",
    label: "Night rate",
    hint: "p/kWh",
    group: "Economy 7",
  },
  {
    key: "e7Standing",
    short: "E7 SC",
    label: "Standing charge",
    hint: "p/day",
    group: "Economy 7",
  },
  {
    key: "peakUnit",
    short: "Peak",
    label: "Peak rate",
    hint: "p/kWh",
    group: "Time of use",
  },
  {
    key: "offPeakUnit",
    short: "Off-peak",
    label: "Off-peak rate",
    hint: "p/kWh",
    group: "Time of use",
  },
  {
    key: "peakStartHour",
    short: "Peak start",
    label: "Peak start",
    hint: "0–23 h",
    group: "Time of use",
  },
  {
    key: "peakEndHour",
    short: "Peak end",
    label: "Peak end",
    hint: "0–23 h",
    group: "Time of use",
  },
  {
    key: "gasUnit",
    short: "Gas unit",
    label: "Unit rate",
    hint: "p/kWh",
    group: "Gas",
  },
  {
    key: "gasStanding",
    short: "Gas SC",
    label: "Standing charge",
    hint: "p/day",
    group: "Gas",
  },
  {
    key: "segExportUnit",
    short: "SEG export",
    label: "Export rate",
    hint: "p/kWh",
    group: "Export",
  },
] as const;
type ColKey = (typeof COLS)[number]["key"];

const GROUP_ORDER = [
  "Electricity",
  "Economy 7",
  "Time of use",
  "Gas",
  "Export",
] as const;

/** Hour-of-day columns (integer 0–23) — validated + rendered differently from
 *  the decimal p/kWh & p/day rate columns. */
const HOUR_KEYS = new Set<ColKey>(["peakStartHour", "peakEndHour"]);

/** localStorage key for the admin's per-browser column-visibility choice. */
const COLS_STORAGE_KEY = "admin.tariffRates.hiddenCols";

type FlatRow = Record<ColKey, number | undefined>;

/**
 * Flatten the grouped DTO rate into the flat column shape used by the table.
 *
 * `"use no memo"` opts this out of the React Compiler. Under
 * `compilationMode: "all"` the compiler injects a `useMemoCache` hook into every
 * top-level function; this one is called from event handlers (outside render),
 * where that hook call would throw "invalid hook call". Same opt-out pattern as
 * `blockForMedia` in the posts editor.
 */
function flatten(r?: TariffRegionRateDTO): FlatRow {
  "use no memo";
  return {
    elecUnit: r?.electricity?.unitRate,
    elecStanding: r?.electricity?.standingCharge,
    e7Day: r?.economy7?.dayRate,
    e7Night: r?.economy7?.nightRate,
    e7Standing: r?.economy7?.standingCharge,
    peakUnit: r?.timeOfUse?.peakRate,
    offPeakUnit: r?.timeOfUse?.offPeakRate,
    peakStartHour: r?.timeOfUse?.peakStartHour,
    peakEndHour: r?.timeOfUse?.peakEndHour,
    gasUnit: r?.gas?.unitRate,
    gasStanding: r?.gas?.standingCharge,
    segExportUnit: r?.segExport,
  };
}

/**
 * While `active`, guard against losing unsaved edits:
 *   • reload / tab close / hard nav — native `beforeunload` prompt. This is the
 *     ONLY leave-confirmation browsers expose and it cannot be themed.
 *   • client route changes (nav links) — intercept anchor clicks in the capture
 *     phase (before Next's router handler), block the navigation, and hand the
 *     href to `onIntercept` so the caller can show its own themed dialog and
 *     navigate on confirm.
 * (Browser back/forward gestures aren't blocked — App Router has no public API
 *  for it and the history hacks are fragile.)
 */
function useUnsavedChangesGuard(
  active: boolean,
  onIntercept: (href: string) => void,
) {
  const onInterceptRef = useRef(onIntercept);
  useEffect(() => {
    onInterceptRef.current = onIntercept;
  });

  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onClickCapture = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      // Block the SPA navigation and let the caller confirm with its own UI.
      e.preventDefault();
      e.stopPropagation();
      onInterceptRef.current(href);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [active]);
}

/** True at Tailwind's `lg` breakpoint and up (≥1024px). Drives whether the
 *  edit UI is the inline side panel (desktop) or a modal (small screens).
 *  Starts false so SSR/first paint assumes mobile; corrected on mount. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

/**
 * Per-region rates for a tariff. The table is read-only; each row has an Edit
 * action that opens that region's inputs: an inline side panel on desktop, or a
 * modal on small screens. Saving persists just that region via
 * `saveTariffRatesAction` and updates the local view so the change shows
 * immediately.
 */
export function TariffRatesTable({
  tariff,
  regions,
  typeLabel,
  onEditProvider,
  onDeleteTariff,
}: {
  tariff: TariffDTO;
  regions: TariffRegionDTO[];
  typeLabel: string;
  /** Opens the provider-edit modal (owned by the parent). */
  onEditProvider?: () => void;
  /** Opens the delete-tariff confirm dialog (owned by the parent). */
  onDeleteTariff?: () => void;
}) {
  // Local, authoritative view of the rates (the parent's `tariff` is client
  // state from search and isn't re-fetched on save).
  const [rates, setRates] = useState<Map<number, FlatRow>>(
    () => new Map(tariff.regions.map((r) => [r.regionId, flatten(r)])),
  );
  // Original provider region label, preserved on save.
  const sourceNames = new Map(
    tariff.regions.map((r) => [r.regionId, r.sourceName]),
  );

  // Panel open/close as a small state machine so BOTH directions animate:
  //   • `mounted`     — is the panel in the DOM (kept during the close anim)
  //   • `visible`     — drives the open/closed CSS (width + opacity/translate)
  //   • `panelRegionId` — which region's content is shown
  // Closing flips `visible` off, then unmounts after the transition so nothing
  // lingers in the layout once collapsed.
  const [panelRegionId, setPanelRegionId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Record<ColKey, string>>(
    {} as Record<ColKey, string>,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // The action to run if the user confirms discarding unsaved edits (switch
  // region / close panel / leave the page). Non-null ⇒ the themed dialog is open.
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const router = useRouter();
  const isDesktop = useIsDesktop();

  // Read-only-table column visibility. The edit panel ALWAYS shows every field,
  // so hiding a column never blocks editing that value. Persisted per browser;
  // hydrated after mount so SSR/first paint render all columns (no mismatch).
  const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(() => new Set());
  useEffect(() => {
    // Sync from the localStorage store once on mount. Wrapped in a helper (like
    // useIsDesktop below) so it reads as an external-store read, not a
    // cascading in-effect setState.
    const hydrate = () => {
      try {
        const saved: unknown = JSON.parse(
          window.localStorage.getItem(COLS_STORAGE_KEY) ?? "[]",
        );
        if (!Array.isArray(saved)) return;
        const valid = new Set<string>(COLS.map((c) => c.key));
        setHiddenCols(
          new Set(saved.filter((k): k is ColKey => valid.has(k as string))),
        );
      } catch {
        /* ignore malformed / unavailable storage */
      }
    };
    hydrate();
  }, []);

  function applyHiddenCols(next: Set<ColKey>) {
    setHiddenCols(next);
    try {
      window.localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }
  function setColShown(key: ColKey, shown: boolean) {
    const next = new Set(hiddenCols);
    if (shown) next.delete(key);
    else next.add(key);
    applyHiddenCols(next);
  }
  function setGroupShown(group: string, shown: boolean) {
    const next = new Set(hiddenCols);
    for (const c of COLS) {
      if (c.group !== group) continue;
      if (shown) next.delete(c.key);
      else next.add(c.key);
    }
    applyHiddenCols(next);
  }

  const visibleCols = COLS.filter((c) => !hiddenCols.has(c.key));
  // Shrink the table's min-width as columns are hidden so hiding actually
  // reclaims horizontal space (static classes so Tailwind can scan them).
  const tableMinW =
    visibleCols.length >= 9
      ? "min-w-250"
      : visibleCols.length >= 6
        ? "min-w-200"
        : visibleCols.length >= 3
          ? "min-w-150"
          : "min-w-100";

  // Keep transition duration (ms) in one place — must match `duration-300`.
  const ANIM_MS = 300;

  const panelRegion = regions.find((r) => r.id === panelRegionId) ?? null;

  // Dirty = the open panel's draft differs from the saved rates for its region.
  const dirty =
    mounted &&
    panelRegionId != null &&
    COLS.some((c) => {
      const saved = rates.get(panelRegionId)?.[c.key];
      return (draft[c.key] ?? "") !== (saved != null ? String(saved) : "");
    });

  // Guard reload + client route changes while there are unsaved edits.
  // Nav-link clicks are blocked and routed through the themed dialog.
  useUnsavedChangesGuard(dirty, (href) =>
    setConfirmAction(() => () => router.push(href)),
  );

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  // Run `action` now, or — if there are unsaved edits — defer it behind the
  // themed confirm dialog.
  function guard(action: () => void) {
    if (dirty) setConfirmAction(() => action);
    else action();
  }

  function doOpenPanel(regionId: number) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const row = rates.get(regionId);
    setDraft(
      Object.fromEntries(
        COLS.map((c) => [
          c.key,
          row?.[c.key] != null ? String(row[c.key]) : "",
        ]),
      ) as Record<ColKey, string>,
    );
    setError(null);
    setPanelRegionId(regionId);
    if (mounted) {
      // Already open (switching region) — just swap content, stay open.
      setVisible(true);
    } else {
      // Mount in the closed state, then flip to open on the next frame so the
      // browser paints the collapsed state first and the transition runs.
      setMounted(true);
      setVisible(false);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true)),
      );
    }
  }

  function openPanel(regionId: number) {
    guard(() => doOpenPanel(regionId));
  }

  function closePanel() {
    setVisible(false);
    setError(null);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (isDesktop) {
      // Desktop: keep the region mounted through the slide/collapse, then unmount.
      closeTimer.current = setTimeout(() => {
        setMounted(false);
        setPanelRegionId(null);
      }, ANIM_MS);
    } else {
      // Mobile: the Modal runs its own exit animation, so close immediately.
      setMounted(false);
      setPanelRegionId(null);
    }
  }

  // Close requested by the user (X / Cancel) — confirm if there are edits.
  function requestClose() {
    guard(closePanel);
  }

  function setField(key: ColKey, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function save() {
    if (panelRegionId == null) return;

    const parsed = {} as FlatRow;
    for (const c of COLS) {
      const v = (draft[c.key] ?? "").trim();
      if (v === "") {
        parsed[c.key] = undefined;
        continue;
      }
      const n = Number(v);
      if (Number.isNaN(n) || n < 0) {
        setError("Values must be non-negative numbers (leave blank to clear).");
        return;
      }
      if (HOUR_KEYS.has(c.key)) {
        // Peak-window hours: whole numbers 0–23.
        if (!Number.isInteger(n) || n > 23) {
          setError("Peak hours must be whole numbers between 0 and 23.");
          return;
        }
        parsed[c.key] = n;
        continue;
      }
      // Rates: DB stores Decimal(7,3) — max 9999.999, 3 decimal places. Enforce
      // the bound and round to 3dp so the saved value matches what's shown (the
      // DB would otherwise round silently).
      if (n > 9999.999) {
        setError("Rates must be 9999.999 or less.");
        return;
      }
      parsed[c.key] = Math.round(n * 1000) / 1000;
    }

    const input: TariffRegionRateInput = {
      regionId: panelRegionId,
      sourceName: sourceNames.get(panelRegionId) ?? panelRegion?.name,
      ...Object.fromEntries(COLS.map((c) => [c.key, parsed[c.key] ?? null])),
    };

    startTransition(async () => {
      const res = await saveTariffRatesAction(tariff.id, [input]);
      if (res.ok) {
        setRates((prev) => new Map(prev).set(panelRegionId, parsed));
        closePanel();
      } else {
        setError(res.error ?? "Could not save.");
      }
    });
  }

  // React-Aria's Table memoizes rows, so closures created inside the
  // `Table.Body` render prop capture STALE component state (the first render's
  // `openPanel`, where mounted/dirty were false). Calling that stale handler
  // re-ran the mount animation (the glitch) and skipped the dirty check. Route
  // the row action through a ref that always holds the latest handler.
  const openPanelRef = useRef(openPanel);
  useEffect(() => {
    openPanelRef.current = openPanel;
  });

  const items = regions.map((reg) => ({
    id: String(reg.id),
    regionId: reg.id,
    name: reg.name,
    values: rates.get(reg.id) ?? ({} as FlatRow),
  }));

  // Shared edit fields — rendered inside the desktop side panel OR the mobile
  // modal (only one is mounted at a time, so the input ids don't collide).
  const fields = (
    <>
      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {GROUP_ORDER.map((group) => (
        <div key={group} className="space-y-2">
          <h4 className="text-xs font-medium text-muted">{group}</h4>
          {COLS.filter((c) => c.group === group).map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between gap-3"
            >
              <label
                htmlFor={`rate-${c.key}`}
                className="text-sm text-foreground"
              >
                {c.label}
                <span className="ml-1 text-xs text-muted">{c.hint}</span>
              </label>
              <Input
                id={`rate-${c.key}`}
                variant="secondary"
                type="number"
                inputMode={HOUR_KEYS.has(c.key) ? "numeric" : "decimal"}
                min={0}
                max={HOUR_KEYS.has(c.key) ? 23 : 9999.999}
                step={HOUR_KEYS.has(c.key) ? 1 : 0.001}
                value={draft[c.key] ?? ""}
                onChange={(e) => setField(c.key, e.target.value)}
                className="w-24 text-end"
                placeholder="—"
              />
            </div>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {tariff.provider.logoUrl && (
            // Fixed square (≈ the two-line header height). A dynamic
            // "match the header height" square isn't reliable in pure CSS:
            // flex resolves an item's width before its stretched height, so
            // `aspect-square` + `self-stretch` collapses to 0 width.
            // `unoptimized` skips next/image's domain allowlist (as the picker).
            <NextImage
              src={tariff.provider.logoUrl}
              alt={`${tariff.provider.name} logo`}
              width={45}
              height={45}
              unoptimized
              className="size-12 shrink-0 rounded-lg border border-border bg-surface-secondary object-contain p-1"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold text-foreground leading-[100%]">
                {tariff.name}
              </h2>
              <Chip size="sm" variant="soft">
                {typeLabel}
              </Chip>
              {tariff.fuel && (
                <Chip size="sm" variant="soft">
                  {tariff.fuel === "dual_fuel"
                    ? "Dual fuel"
                    : "Electricity only"}
                </Chip>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {tariff.provider.isPopular && (
                <StarFill
                  className="mr-1 inline-block size-3.5 align-middle text-warning"
                  role="img"
                  aria-label="Popular provider"
                >
                  <title>Popular provider</title>
                </StarFill>
              )}
              <span className="font-medium text-foreground">
                {tariff.provider.name}
              </span>
              {onEditProvider && (
                <button
                  type="button"
                  onClick={onEditProvider}
                  className="ml-1.5 inline-flex items-center gap-1 align-middle text-xs font-medium text-accent transition-colors hover:underline"
                >
                  <Pencil className="size-3" />
                  Edit provider
                </button>
              )}
              {" · "}rates in pence (p/kWh unit, p/day standing) · edit a region
              from its row action
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Popover>
            <Popover.Trigger className="inline-flex items-center gap-1.5 rounded-3xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white">
              <LayoutColumns className="size-4" />
              Columns
            </Popover.Trigger>
            <Popover.Content className="w-64">
              <Popover.Dialog className="flex max-h-[min(60vh,28rem)] flex-col overflow-hidden p-0">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-xs font-semibold text-muted">
                    Show columns
                  </span>
                  <button
                    type="button"
                    onClick={() => applyHiddenCols(new Set())}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Show all
                  </button>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                  {GROUP_ORDER.map((group) => {
                    const groupCols = COLS.filter((c) => c.group === group);
                    const shown = groupCols.filter(
                      (c) => !hiddenCols.has(c.key),
                    ).length;
                    return (
                      <div key={group} className="space-y-1.5">
                        <Checkbox
                          isSelected={shown === groupCols.length}
                          isIndeterminate={
                            shown > 0 && shown < groupCols.length
                          }
                          onChange={(v) => setGroupShown(group, v)}
                          className="items-center gap-2"
                        >
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Content>
                            <span className="text-sm font-semibold text-foreground">
                              {group}
                            </span>
                          </Checkbox.Content>
                        </Checkbox>
                        <div className="ml-6 flex flex-col gap-1.5">
                          {groupCols.map((c) => (
                            <Checkbox
                              key={c.key}
                              isSelected={!hiddenCols.has(c.key)}
                              onChange={(v) => setColShown(c.key, v)}
                              className="items-center gap-2"
                            >
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                              <Checkbox.Content>
                                <span className="text-sm text-foreground">
                                  {c.label}{" "}
                                  <span className="text-xs text-muted">
                                    ({c.hint})
                                  </span>
                                </span>
                              </Checkbox.Content>
                            </Checkbox>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
          {onDeleteTariff && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-danger"
              onPress={onDeleteTariff}
            >
              <TrashBin className="size-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Table + inline edit panel. The grid ALWAYS has two tracks so only the
          second track's WIDTH animates (0 → 21rem) — never the track count,
          which browsers can't transition (that caused the open/switch glitch).
          The table reflows smoothly; the panel itself fades + slides. */}
      <div
        className={`grid items-start transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none ${
          visible
            ? "lg:grid-cols-[minmax(0,1fr)_21rem]"
            : "lg:grid-cols-[minmax(0,1fr)_0rem]"
        }`}
      >
        {/* Read-only table */}
        <div className="min-w-0">
          <Table>
            <Table.ScrollContainer className="overflow-x-auto">
              <Table.Content
                aria-label={`Regional rates for ${tariff.name}`}
                className={tableMinW}
              >
                <Table.Header>
                  <Table.Column isRowHeader>Region</Table.Column>
                  {visibleCols.map((c) => (
                    <Table.Column key={c.key} className="text-end">
                      <span className="block">{c.short}</span>
                      <span className="block text-[10px] font-normal text-muted">
                        {c.hint}
                      </span>
                    </Table.Column>
                  ))}
                  <Table.Column className="text-end">Edit</Table.Column>
                </Table.Header>
                <Table.Body items={items}>
                  {(row) => (
                    <Table.Row
                      id={row.id}
                      className={
                        row.regionId === panelRegionId
                          ? "bg-accent/5"
                          : undefined
                      }
                    >
                      <Table.Cell>
                        <span className="text-sm font-medium text-foreground">
                          {row.name}
                        </span>
                        <span className="ml-1.5 text-xs text-muted">
                          #{row.regionId}
                        </span>
                      </Table.Cell>
                      {visibleCols.map((c) => (
                        <Table.Cell
                          key={c.key}
                          className="text-end tabular-nums"
                        >
                          {row.values[c.key] != null ? (
                            <span className="text-sm text-foreground">
                              {row.values[c.key]}
                            </span>
                          ) : (
                            <span className="text-sm text-muted">—</span>
                          )}
                        </Table.Cell>
                      ))}
                      <Table.Cell className="text-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          isIconOnly
                          aria-label={`Edit ${row.name} rates`}
                          onPress={() => openPanelRef.current(row.regionId)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>

        {/* Desktop: inline edit panel — the wrapper is clipped by the collapsing
            grid track; the aside fades + slides in/out. (Mobile uses a modal,
            rendered below.) */}
        {isDesktop && mounted && panelRegion && (
          // Sticky so the panel stays in view while scrolling the tall table.
          // `top-20` clears the sticky 64px admin header; `self-start` keeps the
          // wrapper its own height (not stretched) so sticky has room to travel.
          <div className="overflow-hidden lg:sticky lg:top-20 lg:self-start">
            <aside
              className={`mt-4 overflow-hidden rounded-2xl bg-surface-secondary transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none lg:mt-0 lg:ml-4 lg:w-80 ${
                visible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-4 opacity-0"
              }`}
            >
              <div className="flex items-start justify-between gap-2 bg-surface-secondary px-4 py-2.5">
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-medium text-muted">
                    {panelRegion.name}
                  </h3>
                  <p className="text-[10px] text-muted">
                    Region #{panelRegion.id} · rates in pence
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestClose}
                  aria-label="Close panel"
                  className="-mr-1 rounded-md p-1 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <Xmark className="size-4" />
                </button>
              </div>

              <div className="mx-1 space-y-4 rounded-2xl bg-surface p-4">
                {fields}
              </div>

              <div className="flex items-center justify-end gap-2 bg-surface-secondary px-4 py-3">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={pending}
                  className="text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  variant="primary"
                  onPress={save}
                  isPending={pending}
                  isDisabled={pending}
                >
                  Save region
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Mobile: same fields in a modal instead of the side panel. */}
      {!isDesktop && (
        <Modal.Backdrop
          variant="blur"
          isOpen={panelRegionId != null}
          onOpenChange={(open) => {
            if (!open) requestClose();
          }}
        >
          <Modal.Container size="md" scroll="inside">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {panelRegion?.name ?? "Edit rates"}
                </Modal.Heading>
                <p className="mt-1 text-xs text-muted">
                  {panelRegion ? `Region #${panelRegion.id} · ` : ""}rates in
                  pence (p/kWh unit, p/day standing)
                </p>
              </Modal.Header>
              <Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto">
                {fields}
              </Modal.Body>
              <Modal.Footer>
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={pending}
                  className="text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  variant="primary"
                  onPress={save}
                  isPending={pending}
                  isDisabled={pending}
                >
                  Save region
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      )}

      {/* Themed unsaved-changes confirm — replaces the native window.confirm for
          switching regions, closing the panel, and intercepted nav-link clicks.
          (Reload/tab-close still uses the browser's own prompt, which can't be
          themed.) */}
      <Modal.Backdrop
        variant="blur"
        isOpen={confirmAction != null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Discard unsaved changes?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">
                You have unsaved rate edits
                {panelRegion ? ` for ${panelRegion.name}` : ""}. Leaving now
                will discard them.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Keep editing
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  const run = confirmAction;
                  setConfirmAction(null);
                  run?.();
                }}
              >
                Discard changes
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
