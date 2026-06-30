"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  useOverlayState,
} from "@heroui/react";
import { StarFill, Xmark } from "@gravity-ui/icons";
import type { TariffDTO, TariffProviderDTO, TariffRegionDTO } from "../lib/api";
import { listTariffsByProviderAction } from "./actions";
import { TariffRatesTable } from "./TariffRatesTable";
import { TariffFormModal } from "./TariffFormModal";
import { ProviderFormModal } from "./ProviderFormModal";
import { DeleteTariffDialog } from "./DeleteTariffDialog";

const TYPE_LABELS: Record<string, string> = {
  fixed: "Fixed",
  variable: "Variable",
  tracker: "Tracker",
  agile: "Agile",
  economy_7: "Economy 7",
  time_of_use: "Time of use",
  ev: "EV",
  heat_pump: "Heat pump",
  export: "Export",
};

/** Case-insensitive "contains" filter; returns all when the query is blank. */
function filterByName<T extends { name: string }>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
}

/**
 * Clear "×" for a ComboBox — sits just left of the dropdown chevron (which is
 * absolutely positioned at `end-2`), shown only when the field has a value.
 */
function ClearButton({
  show,
  onClear,
  label,
}: {
  show: boolean;
  onClear: () => void;
  label: string;
}) {
  if (!show) return null;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClear}
      className="absolute inset-y-0 end-8 my-auto flex size-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
    >
      <Xmark className="size-4" />
    </button>
  );
}

/**
 * Top-level client orchestrator for the tariff admin page:
 *   - two linked autocompletes — pick a PROVIDER, then a TARIFF of that provider
 *     (both show their full list on focus and filter as you type),
 *   - the editable per-region rate table for the selected tariff,
 *   - a "New tariff" button that opens the create modal.
 */
export function TariffsManager({
  providers,
  regions,
}: {
  providers: TariffProviderDTO[];
  regions: TariffRegionDTO[];
}) {
  const router = useRouter();
  const createOverlay = useOverlayState();
  const providerOverlay = useOverlayState();
  const deleteOverlay = useOverlayState();

  // Provider autocomplete.
  const [providerQuery, setProviderQuery] = useState("");
  const [providerId, setProviderId] = useState<string | null>(null);
  // Tariff autocomplete (scoped to the chosen provider).
  const [tariffQuery, setTariffQuery] = useState("");
  const [tariffs, setTariffs] = useState<TariffDTO[]>([]);
  const [selected, setSelected] = useState<TariffDTO | undefined>(undefined);
  const [, startLoad] = useTransition();

  // Both lists show everything on focus and narrow as you type (client-side —
  // providers are already loaded; a provider's tariffs are fetched on pick).
  const providerItems = filterByName(providers, providerQuery);
  const tariffItems = filterByName(tariffs, tariffQuery);

  function loadTariffs(pid: string) {
    startLoad(async () => setTariffs(await listTariffsByProviderAction(pid)));
  }

  function onProviderSelect(key: React.Key | null) {
    if (key == null) return;
    const p = providers.find((x) => x.id === String(key));
    if (!p) return;
    setProviderId(p.id);
    setProviderQuery(p.name);
    // Reset the tariff side and load this provider's tariffs.
    setTariffQuery("");
    setSelected(undefined);
    setTariffs([]);
    loadTariffs(p.id);
  }

  function onTariffSelect(key: React.Key | null) {
    if (key == null) return;
    const t = tariffs.find((x) => x.id === String(key));
    if (t) {
      setSelected(t);
      setTariffQuery(t.name);
    }
  }

  // Clearing the provider resets the whole flow; clearing the tariff just
  // deselects it (the provider + its list stay).
  function clearProvider() {
    setProviderQuery("");
    setProviderId(null);
    setTariffQuery("");
    setTariffs([]);
    setSelected(undefined);
  }
  function clearTariff() {
    setTariffQuery("");
    setSelected(undefined);
  }

  const onCreated = (created?: TariffDTO) => {
    createOverlay.close();
    if (created) {
      setProviderId(created.provider.id);
      setProviderQuery(created.provider.name);
      setSelected(created);
      setTariffQuery(created.name);
      loadTariffs(created.provider.id);
    }
    router.refresh();
  };

  // Provider to edit = the full record from the loaded list (has note/isPopular);
  // fall back to the selected tariff's provider ref if it's not in the list yet
  // (e.g. just created inline, before the next refresh).
  const editingProvider: TariffProviderDTO | null = selected
    ? (providers.find((p) => p.id === selected.provider.id) ?? {
        ...selected.provider,
        tariffCount: 0,
      })
    : null;

  const onDeleted = () => {
    deleteOverlay.close();
    setSelected(undefined);
    setTariffQuery("");
    if (providerId) loadTariffs(providerId); // drop the deleted one from the list
    router.refresh();
  };

  const onProviderSaved = (updated?: TariffProviderDTO) => {
    providerOverlay.close();
    if (updated && selected && selected.provider.id === updated.id) {
      // Patch the selected tariff's provider in place (it's client state, so a
      // route refresh alone wouldn't update it). Keep the provider field label
      // in sync if the name changed.
      setSelected({
        ...selected,
        provider: {
          id: selected.provider.id,
          name: updated.name,
          slug: updated.slug,
          status: updated.status,
          isPopular: updated.isPopular,
          ...(updated.acquiredBy ? { acquiredBy: updated.acquiredBy } : {}),
        },
      });
      if (providerId === updated.id) setProviderQuery(updated.name);
    }
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Tariffs</h1>
          <p className="mt-1 text-sm text-muted">
            Pick a provider, then one of its tariffs to view and edit its
            regional rates — or create a new one.
          </p>
        </div>
        <Button variant="primary" onPress={createOverlay.open}>
          + New tariff
        </Button>
      </div>

      {/* Two linked autocompletes: provider → its tariffs. Both open on focus
          showing the full list and filter as you type (menuTrigger="focus"). */}
      <div className="grid gap-4 sm:max-w-2xl sm:grid-cols-2">
        {/* 1. Provider */}
        <div>
          <span className="mb-1 block text-sm font-semibold text-foreground">
            Provider
          </span>
          <ComboBox
            aria-label="Provider"
            items={providerItems}
            menuTrigger="focus"
            allowsEmptyCollection
            inputValue={providerQuery}
            onInputChange={setProviderQuery}
            onSelectionChange={onProviderSelect}
          >
            <ComboBox.InputGroup>
              <Input
                variant="secondary"
                fullWidth
                placeholder="Select a provider…"
                className={providerQuery ? "pr-14" : ""}
              />
              <ClearButton
                show={!!providerQuery}
                onClear={clearProvider}
                label="Clear provider"
              />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox
                renderEmptyState={() => (
                  <div className="px-3 py-4 text-sm text-muted">
                    No matching providers.
                  </div>
                )}
              >
                {(p: TariffProviderDTO) => (
                  <ListBoxItem id={p.id} textValue={p.name}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-foreground">
                          {p.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {p.tariffCount}
                      </span>
                      {p.isPopular && (
                        <StarFill className="size-3 shrink-0 text-warning" />
                      )}
                    </div>
                  </ListBoxItem>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        </div>

        {/* 2. Tariff (of the chosen provider) */}
        <div>
          <span className="mb-1 block text-sm font-semibold text-foreground">
            Tariff
          </span>
          <ComboBox
            aria-label="Tariff"
            items={tariffItems}
            menuTrigger="focus"
            allowsEmptyCollection
            isDisabled={!providerId}
            inputValue={tariffQuery}
            onInputChange={setTariffQuery}
            onSelectionChange={onTariffSelect}
          >
            <ComboBox.InputGroup>
              <Input
                variant="secondary"
                fullWidth
                placeholder={
                  providerId ? "Select a tariff…" : "Pick a provider first"
                }
                className={tariffQuery ? "pr-14" : ""}
              />
              <ClearButton
                show={!!tariffQuery}
                onClear={clearTariff}
                label="Clear tariff"
              />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox
                renderEmptyState={() => (
                  <div className="px-3 py-4 text-sm text-muted">
                    {providerId
                      ? "No tariffs for this provider."
                      : "Pick a provider first."}
                  </div>
                )}
              >
                {(t: TariffDTO) => (
                  <ListBoxItem id={t.id} textValue={t.name}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-foreground">
                        {t.name}
                      </span>
                      <Chip size="sm" variant="soft">
                        {TYPE_LABELS[t.type] ?? t.type}
                      </Chip>
                    </div>
                  </ListBoxItem>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        </div>
      </div>

      {/* Selected tariff → editable table */}
      {selected ? (
        <TariffRatesTable
          key={selected.id}
          tariff={selected}
          regions={regions}
          typeLabel={TYPE_LABELS[selected.type] ?? selected.type}
          onEditProvider={providerOverlay.open}
          onDeleteTariff={deleteOverlay.open}
        />
      ) : (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No tariff selected. Pick a provider and a tariff above, or create a
          new tariff.
        </p>
      )}

      <TariffFormModal
        isOpen={createOverlay.isOpen}
        onOpenChange={createOverlay.setOpen}
        providers={providers}
        onCreated={onCreated}
      />

      <ProviderFormModal
        isOpen={providerOverlay.isOpen}
        onOpenChange={providerOverlay.setOpen}
        provider={editingProvider}
        onSaved={onProviderSaved}
      />

      <DeleteTariffDialog
        key={`delete-${selected?.id ?? "none"}`}
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        tariff={selected ?? null}
        onDeleted={onDeleted}
      />
    </>
  );
}
