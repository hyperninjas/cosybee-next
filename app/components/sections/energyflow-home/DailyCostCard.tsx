import { Card, Chip } from "@heroui/react";
import {
  ArrowDown,
  ArrowUp,
  CircleDollar,
  Minus,
} from "@gravity-ui/icons";
import type { DailyCost } from "./types";

/**
 * Right-column card #2 — the day's net running cost. Redesigned for
 * denser information without more visual noise:
 *
 *   • A soft-tinted circular badge frames the CircleDollar icon so the
 *     header reads as a heading, not a label + inline glyph.
 *   • A trend chip on the right compares the running net to yesterday.
 *     Sign-aware — a saving is `success`, a rise is `danger`, unchanged
 *     is `default`.
 *   • Breakdown rows carry a colored dot (import → warning, standing →
 *     muted, export → success) so the eye can pick out where the money is
 *     going without reading each label.
 *   • A stacked composition bar underneath makes the balance visual: on a
 *     zero-cost day it degrades gracefully to a muted rail so it still
 *     anchors the card rather than vanishing.
 *
 * Every color routes through a semantic theme token or a scoped `--efh-*`
 * channel var — no color literals live in this file.
 */

function formatGbp(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}£${Math.abs(value).toFixed(2)}`;
}

type Trend = { label: string; color: "success" | "danger" | "default"; icon: React.ReactElement };

function computeTrend(net: number, prev: number | undefined): Trend | null {
  if (prev === undefined) return null;
  const diff = net - prev;
  const absDiff = Math.abs(diff);
  // Sub-penny deltas read as "unchanged" — noisy microshifts would flip
  // the chip color on every render.
  if (absDiff < 0.01) {
    return {
      label: "same as yesterday",
      color: "default",
      icon: <Minus className="size-3" />,
    };
  }
  if (diff < 0) {
    return {
      label: `${formatGbp(absDiff)} saved vs yesterday`,
      color: "success",
      icon: <ArrowDown className="size-3" />,
    };
  }
  return {
    label: `${formatGbp(absDiff)} more than yesterday`,
    color: "danger",
    icon: <ArrowUp className="size-3" />,
  };
}

export function DailyCostCard({ cost }: { cost: DailyCost }) {
  const trend = computeTrend(cost.netGbp, cost.prevNetGbp);
  const netTone = cost.netGbp < 0 ? "text-success" : "text-foreground";

  // Composition bar segments. Falls back to a single muted rail on a
  // zero-cost day so the visual anchor doesn't collapse.
  const magnitude =
    cost.importGbp + cost.standingGbp + Math.abs(cost.exportCreditGbp);
  const segments =
    magnitude > 0
      ? [
          { color: "var(--warning)", weight: cost.importGbp },
          { color: "var(--muted)", weight: cost.standingGbp },
          { color: "var(--success)", weight: Math.abs(cost.exportCreditGbp) },
        ]
      : [{ color: "var(--separator)", weight: 1 }];

  return (
    <Card variant="default" className="flex h-full flex-col">
      <Card.Header>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
              <CircleDollar className="size-4" />
            </span>
            <Card.Description className="text-[11px] font-semibold uppercase tracking-[0.14em] text-success">
              Net Daily Cost
            </Card.Description>
          </div>
          {trend && (
            <Chip color={trend.color} variant="soft" size="sm">
              <span className="mr-1 inline-flex align-middle">{trend.icon}</span>
              {trend.label}
            </Chip>
          )}
        </div>

        <Card.Title className={`mt-3 text-4xl leading-none ${netTone}`}>
          {formatGbp(cost.netGbp)}
        </Card.Title>
        <Card.Description className="mt-1 italic">
          Import − Export + Standing Charge
        </Card.Description>
      </Card.Header>

      {/* Separator drawn as a token-backed border so it re-themes with the site. */}
      <div className="mx-4 border-t border-separator" role="separator" />

      {/* `flex-1 flex-col` lets the card breathe: the row list sits at the
          top, and `mt-auto` pins the composition bar to the bottom edge
          when the card is stretched taller than its content (right column
          matching the flow diagram's height). */}
      <Card.Content className="flex flex-1 flex-col text-xs">
        <div className="space-y-2.5">
          <Line dot="var(--warning)" label="Import energy" value={cost.importGbp} />
          <Line dot="var(--muted)" label="Standing charge" value={cost.standingGbp} />
          <Line
            dot="var(--success)"
            label="Export credit"
            value={-cost.exportCreditGbp}
          />
        </div>

        <div className="mt-auto pt-4">
          <div
            className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary"
            role="img"
            aria-label="Cost composition"
          >
            {segments.map((seg, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: seg.color,
                  flexGrow: seg.weight || 0.0001,
                }}
                className="h-full"
              />
            ))}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

function Line({
  dot,
  label,
  value,
}: {
  dot: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted">
        <span
          className="inline-block size-2 shrink-0 rounded-full"
          style={{ backgroundColor: dot }}
        />
        {label}
      </span>
      <span className="font-semibold text-foreground tabular-nums">
        {formatGbp(value)}
      </span>
    </div>
  );
}
