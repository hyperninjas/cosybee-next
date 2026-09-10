import { Button, Card, Chip } from "@heroui/react";
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

interface ProviderCardProps {
  title: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  /**
   * The modal-trigger component to render around the CTA button. Kept as
   * a slot so this card stays provider-agnostic and the specific modal
   * (SunSync / Octopus) lives one file away.
   */
  Modal: React.ComponentType<{ children: React.ReactNode }>;
  accent: "solar" | "grid";
}

function ProviderCard({
  title,
  subtitle,
  bullets,
  ctaLabel,
  Modal,
  accent,
}: ProviderCardProps) {
  // Semantic tokens so a theme change re-tints these without touching the
  // component. Solar → warm, grid → blue — matches the diagram's own hexes
  // so the user's eye already knows which provider feeds which channel.
  const tone =
    accent === "solar"
      ? {
          text: "text-[color:var(--efh-solar)]",
          border: "border-[color:var(--efh-solar)]/30",
          soft: "bg-[color:var(--efh-solar)]/10",
        }
      : {
          text: "text-[color:var(--efh-grid)]",
          border: "border-[color:var(--efh-grid)]/30",
          soft: "bg-[color:var(--efh-grid)]/10",
        };

  return (
    <Card variant="default" className={`flex h-full w-full flex-col ${tone.border}`}>
      <Card.Header className="flex-row items-start gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone.soft} ${tone.text}`}
        >
          {accent === "solar" ? (
            <Sun className="size-5" />
          ) : (
            <ThunderboltFill className="size-5" />
          )}
        </div>
        <div className="flex-1">
          <Card.Title>{title}</Card.Title>
          <Card.Description>{subtitle}</Card.Description>
        </div>
      </Card.Header>

      <Card.Content className="flex flex-1 flex-col justify-between gap-4">
        <ul className="space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-foreground">
              <Check className={`mt-0.5 size-4 shrink-0 ${tone.text}`} />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {/* The modal wrapper owns the "open on click" behaviour via
            HeroUI's DialogTrigger. Wrapping the button rather than
            navigating to a page keeps the user in-place. */}
        <Modal>
          <Button variant="primary" className="w-full">
            {ctaLabel}
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </Modal>
      </Card.Content>
    </Card>
  );
}

/**
 * `hasProperty` gates the second half of the empty state. When false we
 * show only the "Set up your home" card because the SunSync / Octopus
 * connect endpoints refuse to run without an active property — trying
 * them anyway hits the backend's "No active property. Create one via
 * POST /api/properties first." error, which is what shipped screenshot
 * #1 was showing.
 */
/**
 * What a customer with a brand we can't read live sees in the solar slot.
 *
 * Their system is described, so we can say what it should generate — the
 * point being that declaring it was worth something, not that they're
 * missing out on a connection they can't have.
 */
function SolarCardStatic({ solar }: { solar: SolarSetup }) {
  const a = solar.analysis;
  const lines = [
    a.capacityKwp !== null ? `${a.capacityKwp} kWp of panels` : null,
    a.estimatedAnnualGenerationKwh !== null
      ? `About ${a.estimatedAnnualGenerationKwh.toLocaleString()} kWh a year, estimated`
      : null,
    a.batteryCapacityKwh !== null && a.batteryCapacityKwh > 0
      ? `${a.batteryCapacityKwh} kWh battery storage`
      : null,
    a.segEligible ? "Eligible to be paid for what you export" : null,
  ].filter((line): line is string => line !== null);

  return (
    <Card className="border-border">
      <Card.Content className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--efh-solar)]/10 text-[color:var(--efh-solar)]">
            <Sun className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Your solar</p>
            <p className="truncate text-xs text-muted">
              {solar.combinationLabel || solar.brandLabel}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5">
          {lines.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--efh-solar)]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
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
 * What a customer on a supplier we can't read live sees in place of the
 * Octopus connect card.
 *
 * Deliberately not a call to action: there is nothing for them to connect
 * yet. It exists so the slot says "here is what your tariff already buys
 * you" rather than advertising a provider they told us they aren't with.
 */
function TariffCardStatic({ energy }: { energy: EnergySetup }) {
  return (
    <Card className="border-border">
      <Card.Content className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--efh-grid)]/10 text-[color:var(--efh-grid)]">
            <ThunderboltFill className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Your tariff</p>
            <p className="truncate text-xs text-muted">{energy.displayTariff}</p>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5">
          {[
            `${energy.providerName} unit rates and standing charge`,
            energy.displayBill
              ? `Costs estimated from ${energy.displayBill}`
              : "Costs estimated from your monthly spend",
            "Swap to measured readings when we support live " +
              `${energy.providerName} accounts`,
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--efh-grid)]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
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
      ) : (
        <Card variant="default" className="w-full">
          <Card.Content className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[color:var(--efh-battery)]/10 text-[color:var(--efh-battery)]">
              <ThunderboltFill className="size-7" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {energy
                ? "Your costs are estimated for now"
                : "Connect your home to see live energy"}
            </h2>
            <p className="max-w-xl text-sm text-muted">
              {energy ? (
                <>
                  We&apos;re estimating your usage from your tariff. Connect
                  your inverter or your supplier and these become measured
                  readings instead of estimates.
                </>
              ) : (
                <>
                  Your dashboard turns on the moment we can talk to your
                  inverter and your energy supplier. Nothing is filled in with
                  averages or fake numbers — you either see your data or you
                  see this screen.
                </>
              )}
            </p>
            {energy && (
              <div className="mt-4 flex flex-col items-center gap-1">
                <p className="text-sm font-medium text-foreground">
                  {energy.displayTariff}
                </p>
                <p className="text-xs text-muted">
                  {[
                    energy.displayBill,
                    energy.dailyKwh !== null
                      ? `about ${energy.dailyKwh.toFixed(1)} kWh a day`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Provider cards — only visible after the home has been set up. */}
      <div
        className={`grid gap-4 lg:grid-cols-2 ${hasProperty ? "" : "pointer-events-none opacity-40"}`}
        aria-hidden={!hasProperty}
      >
        {/* Same three states as the tariff slot opposite: nothing declared
            offers the flow, a Sunsynk owner gets the live connect because
            it's real for them, everyone else sees what their declared
            system already gives them. */}
        {solar == null ? (
          <DeclareSolarCard options={solarOptions ?? null} />
        ) : isSunsynkOwner ? (
          <ProviderCard
            accent="solar"
            title="Connect Sunsynk"
            subtitle="Your inverter and battery"
            bullets={[
              "Live solar generation, battery charge and discharge",
              "Home load and grid flow in real time",
              "Daily kWh totals and 24-hour power history",
            ]}
            ctaLabel="Connect Sunsynk"
            Modal={ConnectSunSyncModal}
          />
        ) : (
          <SolarCardStatic solar={solar} />
        )}
        {/* Three states for this slot, because one "Connect Octopus" button
            served only the customers already with Octopus:
              • no tariff yet   → pick a supplier, same flow as onboarding
              • with Octopus    → offer the live connection, it's real for them
              • anyone else     → show what their tariff already gives them */}
        {energy == null ? (
          <ChooseSupplierCard
            providers={providers ?? []}
            postcode={postcode ?? ""}
          />
        ) : isOctopusCustomer ? (
          <ProviderCard
            accent="grid"
            title="Connect Octopus"
            subtitle="Your tariff and grid consumption"
            bullets={[
              "Live import, export and standing rates in p/kWh",
              "Half-hourly grid consumption from your smart meter",
              "Daily cost and export earnings in £",
            ]}
            ctaLabel="Connect Octopus"
            Modal={ConnectOctopusModal}
          />
        ) : (
          <TariffCardStatic energy={energy} />
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
