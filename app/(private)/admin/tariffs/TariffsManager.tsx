"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
import type { TariffDTO, TariffProviderDTO, TariffRegionDTO } from "../lib/api";
import { searchTariffsAction } from "./actions";
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

/**
 * Top-level client orchestrator for the tariff admin page:
 *   - a ComboBox autocomplete that searches tariffs by name (server action),
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

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TariffDTO[]>([]);
  const [selected, setSelected] = useState<TariffDTO | undefined>(undefined);
  const [, startSearch] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced server-side search as the user types. We never setState
  // synchronously here — the fetch runs inside a timeout/transition, and an
  // empty query simply yields an empty item list (gated below) rather than
  // clearing state in the effect body.
  useEffect(() => {
    const q = query.trim();
    if (debounce.current) clearTimeout(debounce.current);
    if (!q) return;
    debounce.current = setTimeout(() => {
      startSearch(async () => {
        setResults(await searchTariffsAction(q));
      });
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  // Only surface results that match the current query text (avoids showing a
  // stale list after the input is cleared).
  const items = query.trim() ? results : [];

  const onSelect = (key: React.Key | null) => {
    if (key == null) return;
    const hit = results.find((t) => t.id === String(key));
    if (hit) {
      setSelected(hit);
      setQuery(hit.name);
    }
  };

  const onCreated = (created?: TariffDTO) => {
    createOverlay.close();
    if (created) {
      setSelected(created);
      setQuery(created.name);
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
    setQuery("");
    router.refresh();
  };

  const onProviderSaved = (updated?: TariffProviderDTO) => {
    providerOverlay.close();
    if (updated && selected && selected.provider.id === updated.id) {
      // Patch the selected tariff's provider in place (it's client state from
      // search, so a route refresh alone wouldn't update it).
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
    }
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Tariffs</h1>
          <p className="mt-1 text-sm text-muted">
            Search a tariff to view and edit its regional rates, or create a new
            one.
          </p>
        </div>
        <Button variant="primary" onPress={createOverlay.open}>
          + New tariff
        </Button>
      </div>

      {/* Autocomplete search */}
      <div className="max-w-xl">
        <ComboBox
          aria-label="Search tariffs"
          items={items}
          menuTrigger="input"
          inputValue={query}
          onInputChange={setQuery}
          onSelectionChange={onSelect}
          allowsEmptyCollection
        >
          <ComboBox.InputGroup>
            <Input
              variant="secondary"
              fullWidth
              placeholder="Search by tariff or provider name…"
            />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox
              renderEmptyState={() => (
                <div className="px-3 py-4 text-sm text-muted">
                  {query.trim() ? "No matching tariffs." : "Type to search…"}
                </div>
              )}
            >
              {(t: TariffDTO) => (
                <ListBoxItem id={t.id} textValue={t.name}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {t.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {t.provider.name}
                      </span>
                    </div>
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
          No tariff selected. Search above to load one, or create a new tariff.
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
