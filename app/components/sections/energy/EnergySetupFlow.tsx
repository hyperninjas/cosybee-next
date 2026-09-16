"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import {
  Alert,
  Button,
  Description,
  Input,
  Label,
  Radio,
  RadioGroup,
  SearchField,
  Spinner,
  TextField,
} from "@heroui/react";

import { OPTION_CARD } from "@/app/components/ui/OptionCard";
import { ConnectOctopusModal } from "@/app/components/sections/connect/ConnectOctopusModal";
import {
  listTariffs,
  saveEnergySetup,
  type EnergyProvider,
  type EnergyTariff,
} from "@/app/lib/energy-actions";

/**
 * The supplier → tariff → monthly-bill flow.
 *
 * Three phases in one component rather than three routes. The steps are
 * short, the back button has to return to the previous *question* and not
 * the previous page, and a half-finished choice is worthless if it survives
 * a navigation — so the state is local and deliberately not in the URL.
 *
 * ### Why the connect offer sits mid-flow
 *
 * When the chosen supplier is one we can link to, we offer that before
 * asking for a bill estimate: a real account gives measured costs, and
 * asking someone to estimate what we could simply read would be worse. It's
 * an offer, never a gate — "I'll do this later" continues to the tariff
 * list, so nobody reaches the dashboard without a tariff just because they
 * abandoned a login.
 */

interface Props {
  providers: EnergyProvider[];
  postcode: string;
  /**
   * Called once the tariff is saved. The caller decides what follows —
   * onboarding advances to the dashboard, the dashboard closes its dialog
   * and re-renders. Keeping that out of here is what lets one flow serve
   * both without either knowing about the other.
   */
  onDone: () => void;
}

/**
 * Suppliers we can pull live data from, by slug.
 *
 * A stopgap: the backend knows this through `/data-sources`, which is the
 * proper source and what mobile reads. Until the web adopts that call this
 * list is the one hardcoded thing in the flow — deliberately in one named
 * place rather than scattered through the JSX, so replacing it later is a
 * single edit.
 */
const LINKABLE_SLUGS = new Set(["octopus-energy", "octopus"]);

/**
 * Supplier icons live in `public/brand/suppliers/`, mirrored from the
 * mobile app's brand pack. Backend `slug` values don't always match the
 * on-disk name ("E.ON Next" ships as `e-on-next.png`), so we normalise
 * the supplier name to the same kebab shape and only render an icon
 * when the file exists — anything unknown falls back to a first-letter
 * tile so the row still aligns.
 */
const SUPPLIER_ICON_SLUGS = new Set([
  "affect-energy",
  "bristol-energy",
  "british-gas",
  "bulb-octopus",
  "e-on-next",
  "ecotricity",
  "edf-energy",
  "good-energy",
  "green-energy-uk",
  "igloo-energy",
  "octopus-energy",
  "opus-energy",
  "outfox-the-market",
  "ovo-energy",
  "scottish-power",
  "shell-energy",
  "so-energy",
  "utility-warehouse",
]);

function supplierIcon(name: string): string | null {
  const slug = name
    .toLowerCase()
    .replace(/[.\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return SUPPLIER_ICON_SLUGS.has(slug) ? `/brand/suppliers/${slug}.png` : null;
}

type Phase = "supplier" | "connect" | "tariff" | "bill";

export function EnergySetupFlow({ providers, postcode, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("supplier");
  const [query, setQuery] = useState("");
  const [providerId, setProviderId] = useState("");
  const [tariffs, setTariffs] = useState<EnergyTariff[]>([]);
  const [tariffId, setTariffId] = useState("");
  const [bill, setBill] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingTariffs, startTariffLoad] = useTransition();
  const [saving, startSave] = useTransition();

  const provider = providers.find((p) => p.id === providerId) ?? null;
  const isLinkable = provider !== null && LINKABLE_SLUGS.has(provider.slug);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return providers;
    return providers.filter((p) => p.name.toLowerCase().includes(q));
  }, [providers, query]);

  const billValue = Number(bill.trim());
  const billError =
    bill.trim().length > 0 && (!Number.isFinite(billValue) || billValue <= 0)
      ? "Enter a monthly amount, like 95."
      : null;

  function loadTariffsFor(id: string) {
    setError(null);
    startTariffLoad(async () => {
      const rows = await listTariffs(id, postcode);
      setTariffs(rows);
      setTariffId("");
      setPhase("tariff");
    });
  }

  function handleSupplierNext() {
    if (providerId.length === 0) return;
    // Offer the live link first when we have one; otherwise straight to tariffs.
    if (isLinkable) {
      setPhase("connect");
      return;
    }
    loadTariffsFor(providerId);
  }

  function handleSave() {
    if (tariffId.length === 0 || billError !== null || bill.trim().length === 0) return;
    setError(null);
    startSave(async () => {
      const result = await saveEnergySetup({
        providerId,
        tariffId,
        monthlyBillGbp: billValue,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* ── Phase 1: which supplier ─────────────────────────────────── */}
      {phase === "supplier" && (
        <>
          <SearchField
            aria-label="Search suppliers"
            value={query}
            onChange={setQuery}
          >
            <Input placeholder="Search suppliers" />
          </SearchField>

          {providers.length === 0 ? (
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>We couldn&apos;t load the supplier list</Alert.Title>
                <Alert.Description>
                  You can add your tariff later from your account.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : (
            <RadioGroup
              aria-label="Energy supplier"
              className="flex max-h-[26rem] flex-col gap-2 overflow-y-auto pe-1"
              value={providerId}
              onChange={setProviderId}
            >
              {filtered.map((p) => {
                const icon = supplierIcon(p.name);
                return (
                  <Radio
                    key={p.id}
                    value={p.id}
                    className={`${OPTION_CARD} !gap-3 !px-3 !py-2`}
                  >
                    {icon ? (
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                        <Image
                          src={icon}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 object-contain"
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-sm font-semibold text-muted"
                      >
                        {p.name.charAt(0)}
                      </span>
                    )}
                    <Radio.Content>
                      <span className="text-sm font-semibold text-foreground">
                        {p.name}
                      </span>
                      <span className="text-xs text-muted">
                        {p.tariffCount}{" "}
                        {p.tariffCount === 1 ? "tariff" : "tariffs"}
                        {LINKABLE_SLUGS.has(p.slug) &&
                          " · can connect for live data"}
                      </span>
                    </Radio.Content>
                  </Radio>
                );
              })}
            </RadioGroup>
          )}

          {filtered.length === 0 && providers.length > 0 && (
            <p className="text-sm text-muted">
              No supplier matches “{query.trim()}”.
            </p>
          )}

          <Button
            className="self-start"
            variant="primary"
            isDisabled={providerId.length === 0 || loadingTariffs}
            onPress={handleSupplierNext}
          >
            {loadingTariffs ? "Loading tariffs…" : "Continue"}
          </Button>
        </>
      )}

      {/* ── Phase 2: offer the live link ────────────────────────────── */}
      {phase === "connect" && provider !== null && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              Do you have an {provider.name} account?
            </h3>
            <p className="text-sm text-muted">
              Connecting it reads your real meter readings and prices, so your
              costs are measured rather than estimated.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ConnectOctopusModal successHref="/dashboard">
              <Button variant="primary">Connect {provider.name}</Button>
            </ConnectOctopusModal>
            <Button
              variant="tertiary"
              isDisabled={loadingTariffs}
              onPress={() => loadTariffsFor(providerId)}
            >
              {loadingTariffs ? "Loading tariffs…" : "No — pick my tariff instead"}
            </Button>
          </div>

          <button
            type="button"
            className="self-start text-xs text-muted underline underline-offset-2 hover:text-foreground"
            onClick={() => setPhase("supplier")}
          >
            Choose a different supplier
          </button>
        </div>
      )}

      {/* ── Phase 3: which tariff ───────────────────────────────────── */}
      {phase === "tariff" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              Which {provider?.name} tariff are you on?
            </h3>
            <p className="text-sm text-muted">
              If you&apos;re not sure, pick the standard variable one — you can
              change it later.
            </p>
          </div>

          {loadingTariffs ? (
            <div role="status" className="flex items-center gap-3">
              <Spinner size="sm" />
              <p className="text-sm text-muted">Loading tariffs…</p>
            </div>
          ) : tariffs.length === 0 ? (
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>No tariffs listed for this supplier</Alert.Title>
                <Alert.Description>
                  Pick a different supplier, or add your tariff later from your
                  account.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : (
            <RadioGroup
              aria-label="Tariff"
              className="flex max-h-[26rem] flex-col gap-2 overflow-y-auto pe-1"
              value={tariffId}
              onChange={setTariffId}
            >
              {tariffs.map((t) => (
                <Radio
                  key={t.id}
                  value={t.id}
                  className={`${OPTION_CARD} !gap-3 !px-3 !py-2.5`}
                >
                  <Radio.Content>
                    <span className="text-sm font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="text-xs text-muted">
                      {[t.displayRate, t.contractLabel, t.green ? "Green" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
          )}

          <div className="flex gap-3">
            <Button variant="tertiary" onPress={() => setPhase("supplier")}>
              Back
            </Button>
            <Button
              variant="primary"
              isDisabled={tariffId.length === 0}
              onPress={() => setPhase("bill")}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ── Phase 4: monthly spend ──────────────────────────────────── */}
      {phase === "bill" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              Roughly what do you spend a month?
            </h3>
            <p className="text-sm text-muted">
              This is how we turn your tariff into a daily usage estimate. A
              rough figure is fine.
            </p>
          </div>

          <TextField
            value={bill}
            onChange={setBill}
            isInvalid={billError !== null}
            className="max-w-56"
          >
            <Label>Monthly energy spend (£)</Label>
            <Input inputMode="decimal" placeholder="95" autoFocus />
            {billError && (
              <Description className="text-danger">{billError}</Description>
            )}
          </TextField>

          <div className="flex gap-3">
            <Button
              variant="tertiary"
              isDisabled={saving}
              onPress={() => setPhase("tariff")}
            >
              Back
            </Button>
            <Button
              variant="primary"
              isDisabled={
                saving || bill.trim().length === 0 || billError !== null
              }
              onPress={handleSave}
            >
              {saving ? "Saving…" : "Finish setup"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
