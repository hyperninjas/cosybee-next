import type { ReactNode } from "react";
import { Button, Card, Chip, Surface } from "@heroui/react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  House,
  Sun,
  ThunderboltFill,
} from "@gravity-ui/icons";
import { ConnectSunSyncModal } from "@/app/components/sections/connect/ConnectSunSyncModal";
import { ConnectOctopusModal } from "@/app/components/sections/connect/ConnectOctopusModal";
import { PropertySetupModal } from "@/app/components/sections/connect/PropertySetupModal";
import { EnergySetupModal } from "@/app/components/sections/energy/EnergySetupModal";
import { SolarSetupModal } from "@/app/components/sections/solar/SolarSetupModal";
import { EstimatePreview } from "./EstimatePreview";
import type { EnergyProvider, EnergySetup } from "@/app/lib/energy-actions";
import type { SolarOptions, SolarSetup } from "@/app/lib/solar-actions";

/**
 * Tier-0 onboarding: rendered when the user has neither SunSync nor Octopus
 * connected. Replaces the dashboard entirely so we never invent numbers we
 * do not have.
 *
 * Structure mirrors the real dashboard (title row + two-column layout + a
 * summary strip) so a viewer coming from the connected state sees the same
 * shape and can tell what maps to what after connecting.
 *
 * The `?demo=1` link at the bottom lets us keep the current preview
 * reachable for design work and marketing pages that want to show the full
 * dashboard without any real user data.
 */

/**
 * The shell both declared-state cards use.
 *
 * One object rather than two similar ones: the solar and tariff cards sit
 * side by side, so any drift in padding, baseline or action placement
 * between them is visible at a glance. Sharing the frame also means the two
 * lead figures line up, which is what makes them scannable as a pair.
 *
 * `tone` is the energy-flow channel colour — solar orange, grid blue — so a
 * card is identifiable before its title is read, and matches the hue that
 * channel already has in the flow diagram.
 */
function SetupCard({
  tone,
  icon,
  title,
  subtitle,
  lead,
  specs,
  badge,
  actions,
}: {
  tone: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  /** The figure the card exists to communicate. Null when we don't hold it. */
  lead: { value: string; unit: string } | null;
  /** Supporting facts, rendered as one quiet line. */
  specs: string[];
  badge: string | null;
  actions: ReactNode;
}) {
  return (
    <Card className="border-border">
      <Card.Content className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Surface
              variant="transparent"
              className="flex size-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `color-mix(in oklch, ${tone} 12%, transparent)`,
                color: tone,
              }}
            >
              {icon}
            </Surface>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="truncate text-xs text-muted">{subtitle}</p>
            </div>
          </div>
          {badge && (
            <Chip color="default" variant="soft" size="sm">
              {badge}
            </Chip>
          )}
        </div>

        {lead && (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {lead.value}
            </span>
            <span className="text-sm text-muted">{lead.unit}</span>
          </div>
        )}

        {specs.length > 0 && (
          // Non-breaking spaces around the separator: HTML collapses the
          // repeated ordinary spaces this needs, leaving the dots crowding
          // the words on either side.
          <p className="text-xs text-muted">{specs.join("\u00A0 · \u00A0")}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-1">{actions}</div>
      </Card.Content>
    </Card>
  );
}

/**
 * The solar slot once a system is declared.
 *
 * Leads with the figure that matters — what the array should make in a year
 * — and demotes the rest to a spec line beneath it. The previous version
 * gave four facts equal weight as a tick list, which reads as marketing
 * bullets rather than a description of this customer's own home.
 *
 * Connecting an inverter we can read live is an extra action beside
 * changing the system, never a replacement for showing it.
 */
function SolarCard({
  solar,
  options,
  canConnect,
}: {
  solar: SolarSetup;
  options: SolarOptions | null;
  /** True when this brand can be linked and isn't yet. */
  canConnect: boolean;
}) {
  const a = solar.analysis;
  const specs = [
    a.capacityKwp !== null ? `${a.capacityKwp} kWp` : null,
    a.batteryCapacityKwh !== null && a.batteryCapacityKwh > 0
      ? `${a.batteryCapacityKwh} kWh battery`
      : null,
    a.systemAgeYears !== null && a.systemAgeYears > 0
      ? `${a.systemAgeYears} yr${a.systemAgeYears === 1 ? "" : "s"} old`
      : null,
  ].filter((x): x is string => x !== null);

  return (
    <SetupCard
      tone="var(--efh-solar)"
      icon={<Sun className="size-4" />}
      title="Your solar"
      subtitle={solar.combinationLabel || solar.brandLabel}
      lead={
        a.estimatedAnnualGenerationKwh !== null
          ? {
              value: Math.round(a.estimatedAnnualGenerationKwh).toLocaleString(),
              unit: "kWh a year, estimated",
            }
          : null
      }
      specs={specs}
      badge={a.segEligible ? "Paid to export" : null}
      actions={
        <>
          {canConnect && (
            <ConnectSunSyncModal>
              <Button variant="primary" size="sm">
                Connect {solar.brandLabel}
              </Button>
            </ConnectSunSyncModal>
          )}
          {options !== null && (
            <SolarSetupModal options={options}>
              <Button variant="tertiary" size="sm">
                Change system
              </Button>
            </SolarSetupModal>
          )}
        </>
      }
    />
  );
}

/**
 * The nothing-declared slot: describe your system, right here.
 *
 * Replaces a "Connect Sunsynk" button that only ever applied to one brand
 * of the twelve we model.
 */
function DeclareSolarCard({ options }: { options: SolarOptions | null }) {
  return (
    <Card className="border-border">
      <Card.Content className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--efh-solar)]/10 text-[color:var(--efh-solar)]">
            <Sun className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Add your solar and battery
            </p>
            <p className="truncate text-xs text-muted">
              Any brand — we model twelve
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5">
          {[
            "What your panels should generate each year",
            "Your battery capacity and system age",
            "Connect the inverter too, if we support it live",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--efh-solar)]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-1">
          {options === null ? (
            <ConnectSunSyncModal>
              <Button variant="primary" fullWidth>
                Connect Sunsynk
                <ArrowRight className="size-4" />
              </Button>
            </ConnectSunSyncModal>
          ) : (
            <SolarSetupModal options={options}>
              <Button variant="primary" fullWidth>
                Add your system
                <ArrowRight className="size-4" />
              </Button>
            </SolarSetupModal>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

/**
 * The no-tariff slot: pick a supplier, right here.
 *
 * This replaces a "Connect Octopus" card that was useless to anyone not with
 * Octopus — which, given the catalog holds twenty-one suppliers, is most
 * people. Choosing a supplier works for all of them, and connecting an
 * account is then offered inside the flow to the ones we can actually read.
 */
function ChooseSupplierCard({
  providers,
  postcode,
}: {
  providers: EnergyProvider[];
  postcode: string;
}) {
  return (
    <Card className="border-border">
      <Card.Content className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--efh-grid)]/10 text-[color:var(--efh-grid)]">
            <ThunderboltFill className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Add your energy tariff
            </p>
            <p className="truncate text-xs text-muted">
              Your supplier and what you pay
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5">
          {[
            "Your supplier's real unit rates and standing charge",
            "An estimate of what your energy costs each day",
            "Connect the account too, if we support it live",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--efh-grid)]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-1">
          <EnergySetupModal providers={providers} postcode={postcode}>
            <Button variant="primary" fullWidth isDisabled={providers.length === 0}>
              Choose your supplier
              <ArrowRight className="size-4" />
            </Button>
          </EnergySetupModal>
        </div>
      </Card.Content>
    </Card>
  );
}

/**
 * The tariff slot once a supplier is chosen.
 *
 * Mirrors {@link SolarCard}: the monthly spend leads, the tariff name and
 * supplier sit under it as identity, and connecting is an extra action
 * rather than something that replaces the whole card. An earlier version
 * did replace it whenever the supplier was Octopus, which threw away the
 * tariff the customer had just picked.
 */
function TariffCard({
  energy,
  providers,
  postcode,
  canConnect,
}: {
  energy: EnergySetup;
  providers: EnergyProvider[];
  postcode: string;
  /** True when this supplier can be linked and isn't yet. */
  canConnect: boolean;
}) {
  const specs = [
    energy.providerName,
    energy.dailyKwh !== null ? `${energy.dailyKwh.toFixed(1)} kWh a day` : null,
  ].filter((x): x is string => x !== null && x.length > 0);

  const amount = energy.displayBill.split("/")[0] ?? energy.displayBill;

  return (
    <SetupCard
      tone="var(--efh-grid)"
      icon={<ThunderboltFill className="size-4" />}
      title="Your tariff"
      subtitle={energy.tariffName}
      lead={
        energy.displayBill ? { value: amount, unit: "a month, estimated" } : null
      }
      specs={specs}
      badge={canConnect ? null : "Estimated rates"}
      actions={
        <>
          {canConnect && (
            <ConnectOctopusModal>
              <Button variant="primary" size="sm">
                Connect {energy.providerName}
              </Button>
            </ConnectOctopusModal>
          )}
          <EnergySetupModal providers={providers} postcode={postcode}>
            <Button variant="tertiary" size="sm">
              Change tariff
            </Button>
          </EnergySetupModal>
        </>
      }
    />
  );
}

export function ConnectionEmptyState({
  demoHref,
  hasProperty,
  energy,
  providers,
  postcode,
  solar,
  solarOptions,
}: {
  demoHref: string;
  hasProperty: boolean;
  /** The tariff chosen during onboarding, or null if none yet. */
  energy?: EnergySetup | null;
  /** Supplier catalog, for choosing a tariff from here. Only needed when
   *  `energy` is null — the page skips the fetch otherwise. */
  providers?: EnergyProvider[];
  postcode?: string;
  /** The declared solar system, or null if none yet. */
  solar?: SolarSetup | null;
  /** Brand catalog, only needed when `solar` is null. */
  solarOptions?: SolarOptions | null;
}) {
  // Matched on the provider name the backend returns rather than a slug: this
  // is display copy either way, and the name is what the customer picked.
  const isOctopusCustomer =
    energy?.providerName.toLowerCase().includes("octopus") ?? false;
  const isSunsynkOwner =
    solar?.brandLabel.toLowerCase().includes("sunsynk") ?? false;
  // With nothing declared there is no picture to draw, so the hero stays a
  // prompt rather than an empty frame with headings and no figures in it.
  const hasEstimates = energy != null || solar != null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header row — matches the layout of DashboardHeader so the two
          states feel like the same page, just with different content. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Energy Dashboard
          </h1>
          <Chip color="default" variant="soft" size="md">
            Not connected
          </Chip>
        </div>
        <div className="hidden gap-1 md:flex" aria-hidden>
          {/* Muted date navigator — visual echo of the connected state so
              the header row keeps its width; disabled because a date has
              nothing to page through without a data source yet. */}
          <Button size="sm" variant="tertiary" isIconOnly isDisabled aria-label="Previous day">
            <ChevronLeft className="size-4" />
          </Button>
          <Button size="sm" variant="tertiary" isDisabled>
            Today
          </Button>
          <Button size="sm" variant="tertiary" isIconOnly isDisabled aria-label="Next day">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Two-step onboarding. Step 1 (property) blocks step 2 (providers)
          because the backend enforces the same order — no property, no
          connect. Once `hasProperty` is true we skip step 1's hero and
          jump straight to the provider CTAs, so returning users don't
          have to see a "step 1 done" cue for a step they've forgotten. */}
      {!hasProperty ? (
        <Card variant="default" className="w-full">
          <Card.Content className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[color:var(--efh-battery)]/10 text-[color:var(--efh-battery)]">
              <House className="size-7" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              First, tell us about your home
            </h2>
            <p className="max-w-xl text-sm text-muted">
              We&rsquo;ll use it to scope your live data and to fetch the
              right tariff and carbon-intensity feeds for your region. Takes
              about 20 seconds.
            </p>
            <PropertySetupModal>
              <Button variant="primary" className="mt-2">
                Set up your home
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </PropertySetupModal>
          </Card.Content>
        </Card>
      ) : hasEstimates ? (
        /* Something is declared, so show the picture we can already draw
           rather than describing one the customer can't see. */
        <EstimatePreview energy={energy ?? null} solar={solar ?? null} />
      ) : (
        <Card variant="default" className="w-full">
          <Card.Content className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[color:var(--efh-battery)]/10 text-[color:var(--efh-battery)]">
              <ThunderboltFill className="size-7" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Connect your home to see live energy
            </h2>
            <p className="max-w-xl text-sm text-muted">
              Add your solar system or your tariff below and we&rsquo;ll
              estimate what your home uses and generates. Connect an account
              and those estimates become measured readings.
            </p>
          </Card.Content>
        </Card>
      )}

      {/* Provider cards — only visible after the home has been set up. */}
      <div
        className={`grid gap-4 lg:grid-cols-2 ${hasProperty ? "" : "pointer-events-none opacity-40"}`}
        aria-hidden={!hasProperty}
      >
        {/* Two states, not three. Declaring and connecting are different
            things: once a system is declared we always show it, and the
            connect offer rides along inside that card for the brands we can
            read live. Swapping the whole card for a connect CTA hid the
            answer the customer had just given us. */}
        {solar == null ? (
          <DeclareSolarCard options={solarOptions ?? null} />
        ) : (
          <SolarCard
            solar={solar}
            options={solarOptions ?? null}
            canConnect={isSunsynkOwner}
          />
        )}

        {/* Same shape as the solar slot: show the answer, offer the live
            connection alongside it when it applies to this supplier. */}
        {energy == null ? (
          <ChooseSupplierCard
            providers={providers ?? []}
            postcode={postcode ?? ""}
          />
        ) : (
          <TariffCard
            energy={energy}
            providers={providers ?? []}
            postcode={postcode ?? ""}
            canConnect={isOctopusCustomer}
          />
        )}
      </div>

      {/* Footer strip — muted, gives a way back to the demo for design and
          marketing without cluttering the primary flow. */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-secondary p-4 text-sm text-muted">
        <span>
          Just want to see what it looks like when it&rsquo;s all connected?
        </span>
        <a
          href={demoHref}
          className="font-medium text-foreground underline underline-offset-4"
        >
          View demo dashboard
        </a>
      </div>
    </div>
  );
}
