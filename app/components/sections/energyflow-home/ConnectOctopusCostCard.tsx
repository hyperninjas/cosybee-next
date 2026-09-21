"use client";

import { Button, Card, useOverlayState } from "@heroui/react";
import { ArrowRight, Check, Pencil, ThunderboltFill } from "@gravity-ui/icons";
import { ConnectOctopusModal } from "@/app/components/sections/connect/ConnectOctopusModal";
import { EnergySetupModal } from "@/app/components/sections/energy/EnergySetupModal";
import type { EnergyProvider, EnergySetup } from "@/app/lib/energy-actions";

/**
 * Right-column empty state for a dashboard with no Octopus connection.
 *
 * Takes the place of BOTH {@link TariffCard} and {@link DailyCostCard}.
 * Those two used to render regardless, and without Octopus there is no
 * tariff to read and no consumption to price — so they showed the demo
 * fixture ("Octopus Agile", 22.50p, £1.97, "£2.15 saved vs yesterday")
 * under a "Live" chip, which read as this customer's real bill.
 *
 * ### Two variants share ONE frame
 *
 * The layout — centred hero header, panel in the middle, wordmark + CTA
 * footer — is identical in both cases. Only the middle panel changes:
 *
 *  • Nothing declared → three benefit bullets (what connecting unlocks).
 *  • Tariff declared  → the provider · plan · monthly spend the customer
 *    typed in onboarding, so the card reads their answer back to them
 *    instead of an empty pitch.
 *
 * Keeping the outer frame fixed means the card's silhouette on the
 * dashboard doesn't lurch as declared/undeclared state changes.
 */

const UNLOCKS = [
  "Your import and export rates",
  "What today has cost so far",
  "How that compares with yesterday",
] as const;

interface Props {
  /**
   * The tariff the customer declared in onboarding when they picked a
   * non-Octopus supplier. Null when nothing has been declared yet — the card
   * falls back to the benefit bullets.
   */
  energySetup?: EnergySetup | null;
  /** Provider catalog, only needed for the "Change supplier" modal. */
  providers?: EnergyProvider[];
  /** Postcode for tariff lookups inside "Change supplier". */
  postcode?: string;
}

/**
 * Split the backend-formatted "Provider — Tariff name" into its two parts so
 * the tariff name doesn't wrap into a second line of the provider heading.
 * The dash comes from the backend and is always the em/en-dash separator;
 * when it isn't present (older payloads) we render the whole thing as the
 * heading.
 */
function splitTariff(displayTariff: string): { provider: string; tariff: string | null } {
  const match = displayTariff.match(/^(.+?)\s+[—–-]\s+(.+)$/);
  if (match) return { provider: match[1]!.trim(), tariff: match[2]!.trim() };
  return { provider: displayTariff.trim(), tariff: null };
}

export function ConnectOctopusCostCard({
  energySetup = null,
  providers = [],
  postcode = "",
}: Props) {
  const declared = energySetup !== null;

  return (
    // Both axes centred: `items-center` on the horizontal, and
    // `justify-center` on the vertical. Card.Content was stretching to
    // fill the column (HeroUI's default), which prevented the stack
    // from moving as a group — with the content back to shrink-to-fit
    // (see the `flex-none` below), the three bands cluster together
    // and float to the middle with even space above and below.
    <Card
      variant="default"
      className="flex h-full w-full flex-col items-center justify-center gap-2"
    >
      <Card.Header className="items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft ring-8 ring-primary-soft/40">
          <ThunderboltFill className="size-6 text-primary" aria-hidden />
        </span>
        <Card.Title className="text-balance text-xl leading-tight font-bold sm:text-2xl">
          {declared
            ? "Connect Octopus for live rates and daily cost"
            : "Connect Octopus to see your tariff and daily cost"}
        </Card.Title>
        <Card.Description className="text-balance text-sm leading-relaxed sm:text-base">
          {declared
            ? "You told us the estimate below. Link Octopus and we'll replace it with your actual import, export and daily cost."
            : "We read your rates and meter readings from Octopus, so these figures stay empty until it's linked."}
        </Card.Description>
      </Card.Header>

      {/* `flex-none` so Content sizes to the panel and doesn't stretch to
          fill the column — otherwise the header + footer can't cluster
          with it in a single centred group. */}
      <Card.Content className="!flex-none">
        {declared ? (
          <DeclaredPanel
            setup={energySetup}
            providers={providers}
            postcode={postcode}
          />
        ) : (
          <UnlocksPanel />
        )}
      </Card.Content>

      <Card.Footer className="flex-row items-center justify-center gap-6">
        <span
          aria-label="Octopus Energy"
          className="text-lg leading-none font-bold tracking-tight"
        >
          <span style={{ color: "#100030" }}>octopus</span>
          <span className="font-normal text-muted"> energy</span>
        </span>
        <ConnectOctopusModal>
          <Button variant="primary" className="rounded-full">
            Connect Octopus
            <ArrowRight className="ms-1 size-4" aria-hidden />
          </Button>
        </ConnectOctopusModal>
      </Card.Footer>
    </Card>
  );
}

function UnlocksPanel() {
  return (
    <ul className="mx-auto flex w-full max-w-md flex-col gap-3 rounded-2xl bg-surface-secondary p-4 sm:p-5">
      {UNLOCKS.map((item) => (
        <li key={item} className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-white shadow-sm"
          >
            <Check className="size-3.5" />
          </span>
          <span className="text-sm leading-6 text-foreground sm:text-base">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The "declared tariff" panel — same rounded-secondary frame as
 * {@link UnlocksPanel} so the card's silhouette doesn't shift. Two-column
 * key/value grid: supplier + plan on the left, monthly spend + daily kWh on
 * the right. Values are backend-formatted strings; render verbatim.
 */
function DeclaredPanel({
  setup,
  providers,
  postcode,
}: {
  setup: EnergySetup;
  providers: EnergyProvider[];
  postcode: string;
}) {
  const { provider, tariff } = splitTariff(setup.displayTariff);
  const dailyKwh =
    setup.dailyKwh !== null && Number.isFinite(setup.dailyKwh)
      ? `${setup.dailyKwh.toFixed(1)} kWh`
      : null;

  // Owned overlay state so the edit icon can sit ANYWHERE in this layout
  // (absolute-positioned in the corner) without being trapped inside
  // Modal.Trigger's wrapper div — the wrapper's zero-flow height was
  // eating the click through the react-aria trigger context.
  const overlay = useOverlayState();

  return (
    <div className="relative mx-auto w-full max-w-md rounded-2xl bg-surface-secondary p-4 text-left sm:p-5">
      {/* Plain <button> deliberately: onClick is direct DOM, not
          routed via react-aria's DialogTrigger context, so it fires
          reliably from an absolute-positioned corner slot. */}
      <button
        type="button"
        aria-label="Change supplier"
        onClick={() => overlay.open()}
        className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Pencil className="size-4" aria-hidden />
      </button>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 pe-8">
        <PanelField label="Supplier" value={provider} title={provider} />
        <PanelField
          label="Monthly spend"
          value={setup.displayBill || "—"}
        />
        <PanelField
          label="Plan"
          value={tariff ?? "—"}
          title={tariff ?? undefined}
        />
        <PanelField label="Estimated use" value={dailyKwh ?? "—"} />
      </div>

      {/* Modal without a trigger — controlled by `state` above. */}
      <EnergySetupModal
        providers={providers}
        postcode={postcode}
        state={overlay}
      />
    </div>
  );
}

function PanelField({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div
        className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base"
        title={title}
      >
        {value}
      </div>
    </div>
  );
}
