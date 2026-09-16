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
  TextField,
} from "@heroui/react";

import { OPTION_CARD } from "@/app/components/ui/OptionCard";
import { ConnectSunSyncModal } from "@/app/components/sections/connect/ConnectSunSyncModal";
import { saveSolarSetup, type SolarOptions } from "@/app/lib/solar-actions";

/**
 * The solar → battery declaration: brand, product, panels, install year.
 *
 * The hardware mirror of `EnergySetupFlow`. Step 3 used to be "Connect
 * Sunsynk", which served one brand of the twelve we model — everyone else
 * could only skip, and their system then didn't exist as far as the app was
 * concerned.
 *
 * Declaring is worth real output even when we can't read the inverter live:
 * capacity, expected annual generation, battery size, age-based degradation,
 * and whether they qualify for the Smart Export Guarantee.
 *
 * Sunsynk owners are offered the live connection first, for the same reason
 * Octopus customers are: measured beats declared. It's an offer, not a gate.
 */

interface Props {
  options: SolarOptions;
  onDone: () => void;
  /** Rendered when the customer says they have no solar at all. */
  onSkip?: () => void;
}

/**
 * Brands we can read live, by id.
 *
 * The same stopgap as the supplier flow's `LINKABLE_SLUGS`: the backend
 * already knows this through `/data-sources`, and already declines to
 * suggest Sunsynk to someone who declared another brand. One named constant
 * so adopting that call later is a single edit.
 */
const LINKABLE_BRANDS = new Set(["sunsynk"]);

/**
 * Brand-id → filename in `public/brand/solar/`. The catalog id sometimes
 * differs from the marketing spelling ("foxess" vs "Fox ESS"), so a small
 * explicit table beats normalising on every render. Falls back to no icon
 * — the row still renders label + subtitle text.
 */
const BRAND_ICON_FILES: Record<string, string> = {
  alphaess: "alphaess.png",
  enphase: "enphase.png",
  foxess: "fox-ess.png",
  givenergy: "givenergy.png",
  goodwe: "goodwe.png",
  growatt: "growatt.png",
  luxpower: "luxpower.png",
  sigenergy: "sigenergy.png",
  solaredge: "solaredge.png",
  solis: "solis.png",
  sunsynk: "sunsynk.png",
  tesla: "tesla.png",
};

function brandIcon(id: string): string | null {
  const key = id.toLowerCase().replace(/[^a-z0-9]/g, "");
  const file = BRAND_ICON_FILES[key];
  return file ? `/brand/solar/${file}` : null;
}

type Phase = "brand" | "connect" | "product" | "panels";

export function SolarSetupFlow({ options, onDone, onSkip }: Props) {
  const [phase, setPhase] = useState<Phase>("brand");
  const [brandId, setBrandId] = useState("");
  const [combinationId, setCombinationId] = useState("");
  const [panelCount, setPanelCount] = useState("");
  const [panelWattage, setPanelWattage] = useState("");
  const [installYear, setInstallYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const brand = options.brands.find((b) => b.id === brandId) ?? null;
  const isLinkable = brand !== null && LINKABLE_BRANDS.has(brand.id);
  const products = useMemo(
    () => options.combinations[brandId] ?? [],
    [options.combinations, brandId],
  );

  // Default the wattage to the middle of the offered range rather than the
  // smallest: most installs are recent, and a too-low default quietly
  // understates every downstream figure for anyone who doesn't change it.
  const defaultWattage = useMemo(() => {
    const list = options.panelWattages;
    return list.length > 0 ? String(list[Math.floor(list.length / 2)]) : "";
  }, [options.panelWattages]);

  const counts = parseInt(panelCount, 10);
  const year = parseInt(installYear, 10);
  const { min, max } = options.installYearRange;

  const countError =
    panelCount.trim().length > 0 &&
    (!Number.isInteger(counts) || counts < 1 || counts > 100)
      ? "Enter a number of panels between 1 and 100."
      : null;
  const yearError =
    installYear.trim().length > 0 &&
    (!Number.isInteger(year) || year < min || year > max)
      ? `Enter a year between ${min} and ${max}.`
      : null;

  const canSave =
    combinationId.length > 0 &&
    panelCount.trim().length > 0 &&
    installYear.trim().length > 0 &&
    panelWattage.trim().length > 0 &&
    countError === null &&
    yearError === null;

  function pickBrand() {
    if (brandId.length === 0) return;
    setPanelWattage((w) => (w.length > 0 ? w : defaultWattage));
    setPhase(isLinkable ? "connect" : "product");
  }

  function handleSave() {
    if (!canSave) return;
    setError(null);
    startSave(async () => {
      const result = await saveSolarSetup({
        brandId,
        combinationId,
        panelCount: counts,
        panelWattage: parseInt(panelWattage, 10),
        installYear: year,
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

      {/* ── Which brand ─────────────────────────────────────────────── */}
      {phase === "brand" && (
        <>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              What solar or battery system do you have?
            </h3>
            <p className="text-sm text-muted">
              We use it to estimate what your panels generate and what your
              battery can store.
            </p>
          </div>

          <RadioGroup
            aria-label="Inverter brand"
            className="flex max-h-[24rem] flex-col gap-2 overflow-y-auto pe-1"
            value={brandId}
            onChange={setBrandId}
          >
            {options.brands.map((b) => {
              const icon = brandIcon(b.id);
              return (
                <Radio
                  key={b.id}
                  value={b.id}
                  className={`${OPTION_CARD} !gap-3 !px-3 !py-2`}
                >
                  {/* No `Radio.Control` — the whole card selects on
                      click and the accent border on `data-selected` in
                      OPTION_CARD is the visual state. A separate dot
                      alongside the brand tile was redundant here. */}
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
                      {b.label.charAt(0)}
                    </span>
                  )}
                  <Radio.Content>
                    <span className="text-sm font-semibold text-foreground">
                      {b.label}
                    </span>
                    <span className="text-xs text-muted">
                      {[
                        b.subtitle,
                        LINKABLE_BRANDS.has(b.id)
                          ? "can connect for live data"
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Radio.Content>
                </Radio>
              );
            })}
          </RadioGroup>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              isDisabled={brandId.length === 0}
              onPress={pickBrand}
            >
              Continue
            </Button>
            {onSkip && (
              <Button variant="tertiary" onPress={onSkip}>
                I don&apos;t have solar
              </Button>
            )}
          </div>
        </>
      )}

      {/* ── Offer the live link ─────────────────────────────────────── */}
      {phase === "connect" && brand !== null && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              Do you have a {brand.label} account?
            </h3>
            <p className="text-sm text-muted">
              Connecting it reads your inverter directly, so generation and
              battery levels are live rather than estimated.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ConnectSunSyncModal>
              <Button variant="primary">Connect {brand.label}</Button>
            </ConnectSunSyncModal>
            <Button variant="tertiary" onPress={() => setPhase("product")}>
              No — describe my system instead
            </Button>
          </div>

          <button
            type="button"
            className="self-start text-xs text-muted underline underline-offset-2 hover:text-foreground"
            onClick={() => setPhase("brand")}
          >
            Choose a different brand
          </button>
        </div>
      )}

      {/* ── Which product ───────────────────────────────────────────── */}
      {phase === "product" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              Which {brand?.label} system?
            </h3>
            <p className="text-sm text-muted">
              The inverter size and battery capacity are usually on the unit
              itself, or on your installation paperwork.
            </p>
          </div>

          {products.length === 0 ? (
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>No models listed for this brand</Alert.Title>
                <Alert.Description>
                  Pick a different brand, or add your system later from your
                  account.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : (
            <RadioGroup
              aria-label="System"
              className="flex max-h-[24rem] flex-col gap-2 overflow-y-auto pe-1"
              value={combinationId}
              onChange={setCombinationId}
            >
              {products.map((p) => {
                const hasBattery = p.batteryKwh !== null && p.batteryKwh > 0;
                return (
                  <Radio
                    key={p.id}
                    value={p.id}
                    className={`${OPTION_CARD} !gap-3 !px-3 !py-2.5`}
                  >
                    <Radio.Content>
                      <span className="text-sm font-semibold text-foreground">
                        {p.label}
                      </span>
                      <span className="text-xs text-muted">
                        {hasBattery
                          ? `${p.inverterKw} kW inverter · ${p.batteryKwh} kWh battery`
                          : `${p.inverterKw} kW inverter · no battery`}
                      </span>
                    </Radio.Content>
                  </Radio>
                );
              })}
            </RadioGroup>
          )}

          <div className="flex gap-3">
            <Button variant="tertiary" onPress={() => setPhase("brand")}>
              Back
            </Button>
            <Button
              variant="primary"
              isDisabled={combinationId.length === 0}
              onPress={() => setPhase("panels")}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ── Panels and age ──────────────────────────────────────────── */}
      {phase === "panels" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-foreground">
              Tell us about your panels
            </h3>
            <p className="text-sm text-muted">
              Panel count and age set how much we expect the array to generate.
            </p>
          </div>

          {/* Two-up on wider screens, stacked on narrow. No `autoFocus`
              — the theme's accent focus ring on a required numeric field
              on modal-open reads as an "error" state. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              value={panelCount}
              onChange={setPanelCount}
              isInvalid={countError !== null}
            >
              <Label className="text-sm font-medium text-foreground">
                How many panels?
              </Label>
              <Input inputMode="numeric" placeholder="12" />
              {countError && (
                <Description className="text-danger">{countError}</Description>
              )}
            </TextField>

            <TextField
              value={installYear}
              onChange={setInstallYear}
              isInvalid={yearError !== null}
            >
              <Label className="text-sm font-medium text-foreground">
                Year installed
              </Label>
              <Input inputMode="numeric" placeholder={String(max - 2)} />
              {yearError && (
                <Description className="text-danger">{yearError}</Description>
              )}
            </TextField>
          </div>

          <RadioGroup
            aria-label="Panel wattage"
            className="flex flex-col gap-2"
            value={panelWattage}
            onChange={setPanelWattage}
          >
            <Label className="text-sm font-medium text-foreground">
              Panel size
            </Label>
            <Description className="text-xs text-muted">
              Most modern panels are 400W. If you&apos;re unsure, leave it as it
              is.
            </Description>
            {/* Fixed-width rectangular pills so every value sits on the
                same baseline and the row reads as a group. `rounded-full`
                + variable-length labels made 400W (which used to carry a
                "common" sub-label) taller than the neighbours; that hint
                lives in the description above the row instead. */}
            <div className="mt-1 flex flex-wrap gap-2">
              {options.panelWattages.map((w) => (
                <Radio
                  key={w}
                  value={String(w)}
                  className={
                    "flex min-w-[4.5rem] cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors " +
                    "data-[hovered=true]:bg-surface-secondary " +
                    "data-[selected=true]:border-accent data-[selected=true]:bg-accent/10"
                  }
                >
                  <Radio.Content>{w}W</Radio.Content>
                </Radio>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2 border-t border-separator pt-5">
            <Button
              variant="tertiary"
              isDisabled={saving}
              onPress={() => setPhase("product")}
            >
              Back
            </Button>
            <Button
              variant="primary"
              isDisabled={!canSave || saving}
              onPress={handleSave}
            >
              {saving ? "Saving…" : "Save my system"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
