import { Button, Chip } from "@heroui/react";
import { House } from "@gravity-ui/icons";

import { RefineEstimateModal } from "./RefineEstimateModal";
import type { EpcRating } from "@/app/lib/epc-actions";

/**
 * The home's energy rating, as the middle tile of the dashboard's status
 * row — between the inverter and the tariff.
 *
 * Three states:
 *
 *   • **Official certificate** — band and score, nothing to act on. An EPC
 *     from the government register is not ours to edit.
 *   • **Estimate** — band and score with an "Estimated" chip and a
 *     "Refine" action opening the 11-question flow.
 *   • **No rating yet** — the home has no profile the backend can score.
 *
 * The refine action keys on `isSynthetic`, not on how complete the answers
 * are. That is deliberate, and matches mobile: it means the action stays
 * put after every edit and only disappears once a real certificate is
 * linked. Tying it to completeness would make it vanish mid-flow and read
 * as if the resident's answers had not registered.
 *
 * Never call this an EPC in copy. It is an estimate until a certificate
 * says otherwise, and band A is deliberately unreachable — the estimator
 * caps at 91, because awarding the top band off a questionnaire would
 * overstate what we actually know.
 */

/** Band colours follow the standard EPC scale: A/B green down to F/G red. */
const BAND_TONE: Record<string, string> = {
  A: "bg-success/15 text-success-foreground",
  B: "bg-success/15 text-success-foreground",
  C: "bg-success/10 text-success-foreground",
  D: "bg-warning/15 text-warning-foreground",
  E: "bg-warning/20 text-warning-foreground",
  F: "bg-danger/15 text-danger-foreground",
  G: "bg-danger/20 text-danger-foreground",
};

export function EpcRatingCard({ rating }: { rating: EpcRating }) {
  const band = rating.band?.trim().toUpperCase() ?? null;
  const tone = (band && BAND_TONE[band]) ?? "bg-surface-secondary text-muted";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone}`}
        // Decorative: the subtitle already states the band in words, so
        // exposing the letter here just makes a screen reader say "F" and
        // then "Band F" a moment later.
        aria-hidden
      >
        {band ?? <House className="size-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-semibold text-foreground">
            Energy rating
          </p>
          {rating.isSynthetic && (
            <Chip color="default" variant="soft" size="sm">
              Estimated
            </Chip>
          )}
        </div>
        <p className="truncate text-xs text-muted">{subtitle(rating, band)}</p>
      </div>

      {rating.isSynthetic && (
        <RefineEstimateModal answers={rating.answers}>
          <Button variant="tertiary" size="sm">
            Refine
          </Button>
        </RefineEstimateModal>
      )}
    </div>
  );
}

/**
 * Band and score are sourced separately and either can be missing — the
 * band comes only from `home-summary`, the score can also be recovered
 * from the profile. Cover each combination rather than assuming a score
 * always arrives with a letter.
 */
function subtitle(rating: EpcRating, band: string | null): string {
  if (!rating.hasProfile) return "Set up your home to see its rating";

  const suffix = rating.isSynthetic ? " estimated" : "";
  if (band !== null && rating.score !== null) {
    return `Band ${band} · ${rating.score}/100${suffix}`;
  }
  if (band !== null) return `Band ${band}${rating.isSynthetic ? ", estimated" : ""}`;
  if (rating.score !== null) return `${rating.score}/100${suffix}`;
  return "No rating available yet";
}
