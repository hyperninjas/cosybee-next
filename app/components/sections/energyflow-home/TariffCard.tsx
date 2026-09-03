import { Card, Chip } from "@heroui/react";
import { ThunderboltFill } from "@gravity-ui/icons";
import type { TariffInfo } from "./types";

/**
 * Right-column card #1 — the current import tariff. Redesigned to match
 * the {@link DailyCostCard} layout so the two cards read as siblings: a
 * soft-badged icon in the header, a status chip on the right, big value
 * with unit below, a token-backed divider, and a small stats grid at the
 * bottom.
 *
 * Every color routes through a semantic theme token; nothing here uses a
 * raw color literal.
 */

function formatPence(pence: number): string {
  return `${pence.toFixed(2)}p`;
}

/**
 * Friendly product name for an Octopus import tariff code, e.g.
 * `E-1R-IOG-SMB-FIX-12M-26-06-13-G` → `Intelligent Octopus Go`.
 *
 * Octopus tariff codes are `{fuel}-{rateCount}R-{productSlug}-...`, and
 * the readable name is entirely determined by the product slug. Anything
 * we don't recognise falls back to the raw code so the card never lies
 * about which tariff is live.
 */
function friendlyTariffName(code: string): string | null {
  const parts = code.trim().toUpperCase().split("-");
  if (parts.length < 3) return null;
  const [, rateCount, slug] = parts as [string, string, string];
  const nameBySlug: Record<string, string> = {
    IOG: "Intelligent Octopus Go",
    GO: "Octopus Go",
    AGILE: "Octopus Agile",
    COSY: "Cosy Octopus",
    TRACKER: "Octopus Tracker",
    FLUX: "Octopus Flux",
    VAR: "Octopus Flexible",
    FIX: "Octopus Fixed",
    OUTGOING: "Outgoing Octopus",
    OE: "Octopus Energy",
  };
  const base = nameBySlug[slug];
  if (!base) return null;
  return rateCount === "2R" ? `${base} (Economy 7)` : base;
}

export function TariffCard({ tariff }: { tariff: TariffInfo }) {
  // A tariff of zero pence is either a fixed contract or a temporarily
  // free window — either way it's celebration-worthy on this dashboard.
  const isFree = tariff.importPence <= 0;
  const friendly = friendlyTariffName(tariff.name);
  const displayName = friendly ?? tariff.name;
  // Only show the raw product code as a subtitle when we managed to derive
  // a human name from it — otherwise the raw code IS the title and
  // repeating it would just add clutter.
  const subtitle = friendly ? tariff.name : null;

  return (
    <Card variant="default" className="h-full">
      <Card.Header>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
              <ThunderboltFill className="size-4" />
            </span>
            <Card.Description className="text-[11px] font-semibold uppercase tracking-[0.14em] text-success">
              Current Tariff
            </Card.Description>
          </div>
          <Chip color={isFree ? "success" : "default"} variant="soft" size="sm">
            {isFree ? "Free import" : "Live"}
          </Chip>
        </div>

        <Card.Title className="mt-3 text-2xl leading-tight truncate">
          {displayName}
        </Card.Title>
        {subtitle && (
          <div
            className="mt-0.5 truncate text-[11px] font-mono text-muted"
            title={subtitle}
          >
            {subtitle}
          </div>
        )}
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-semibold text-success tabular-nums">
            {formatPence(tariff.importPence)}
          </span>
          <span className="text-sm text-muted">/ kWh now</span>
        </div>
      </Card.Header>

      {/* Token-backed divider — re-themes with the rest of the card. */}
      <div className="mx-4 border-t border-separator" role="separator" />

      <Card.Content className="grid grid-cols-2 gap-4 text-xs">
        <Stat label="Export rate" value={`${formatPence(tariff.exportPence)}/kWh`} />
        <Stat label="Standing charge" value={`${formatPence(tariff.standingPence)}/day`} />
      </Card.Content>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted">{label}</div>
      <div className="mt-1 font-semibold text-foreground tabular-nums">
        {value}
      </div>
    </div>
  );
}
