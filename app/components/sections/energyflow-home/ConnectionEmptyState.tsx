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
export function ConnectionEmptyState({
  demoHref,
  hasProperty,
}: {
  demoHref: string;
  hasProperty: boolean;
}) {
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
              Connect your home to see live energy
            </h2>
            <p className="max-w-xl text-sm text-muted">
              Your dashboard turns on the moment we can talk to your inverter
              and your energy supplier. Nothing is filled in with averages or
              fake numbers — you either see your data or you see this screen.
            </p>
          </Card.Content>
        </Card>
      )}

      {/* Provider cards — only visible after the home has been set up. */}
      <div
        className={`grid gap-4 lg:grid-cols-2 ${hasProperty ? "" : "pointer-events-none opacity-40"}`}
        aria-hidden={!hasProperty}
      >
        <ProviderCard
          accent="solar"
          title="Connect SunSync"
          subtitle="Your inverter and battery"
          bullets={[
            "Live solar generation, battery charge and discharge",
            "Home load and grid flow in real time",
            "Daily kWh totals and 24-hour power history",
          ]}
          ctaLabel="Connect SunSync"
          Modal={ConnectSunSyncModal}
        />
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
