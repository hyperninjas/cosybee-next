import { Card, Meter, Surface } from "@heroui/react";

import type { EnergySetup } from "@/app/lib/energy-actions";
import type { SolarSetup } from "@/app/lib/solar-actions";

/**
 * The estimated picture of a home, shown before any live connection.
 *
 * This slot used to be a tall empty card holding one sentence about what
 * would happen once the customer connected something — the largest element
 * on the page saying the least, while four real figures sat underneath it
 * rendered as bullet points.
 *
 * They aren't fake numbers. The daily usage comes from the tariff and the
 * monthly spend the customer entered; the annual generation comes from the
 * declared array and its age. So the honest move is to show them properly
 * and label them as estimates, rather than to describe a dashboard the
 * customer can't see yet.
 *
 * Every figure is optional and the layout adapts: a home with a tariff and
 * no solar gets two tiles and no coverage bar, and nothing renders a
 * placeholder for a number we don't hold.
 */

/** Days used to turn a daily estimate into an annual one. */
const DAYS_PER_YEAR = 365;

interface Tile {
  label: string;
  value: string;
  unit: string;
  tone: string;
}

export function EstimatePreview({
  energy,
  solar,
}: {
  energy: EnergySetup | null;
  solar: SolarSetup | null;
}) {
  const dailyKwh = energy?.dailyKwh ?? null;
  const annualSolarKwh = solar?.analysis.estimatedAnnualGenerationKwh ?? null;
  const batteryKwh = solar?.analysis.batteryCapacityKwh ?? null;

  const tiles: Tile[] = [];
  if (dailyKwh !== null) {
    tiles.push({
      label: "You use",
      value: dailyKwh.toFixed(1),
      unit: "kWh a day",
      tone: "var(--efh-home)",
    });
  }
  if (annualSolarKwh !== null) {
    tiles.push({
      label: "Panels make",
      value: Math.round(annualSolarKwh).toLocaleString(),
      unit: "kWh a year",
      tone: "var(--efh-solar)",
    });
  }
  if (batteryKwh !== null && batteryKwh > 0) {
    tiles.push({
      label: "Battery holds",
      value: String(batteryKwh),
      unit: "kWh",
      tone: "var(--efh-battery)",
    });
  }
  if (energy?.displayBill) {
    tiles.push({
      label: "You spend",
      // The backend formats this as "£120.00/month"; split so the figure can
      // carry the display weight and the period sits beside it as a unit,
      // matching the other three tiles.
      value: energy.displayBill.split("/")[0] ?? energy.displayBill,
      unit: "a month",
      tone: "var(--efh-grid)",
    });
  }

  // A year of generation against a year of usage. Both sides are estimates,
  // so this is only shown when we hold both — never half-computed from a
  // default.
  //
  // ⚠️ This is a comparison of annual totals, NOT self-sufficiency, and the
  // copy has to say so. Solar peaks at midday and in summer while a home's
  // demand is evenings and winter, so a house that generates 107% of what it
  // uses still imports most winter evenings — real self-consumption for a
  // domestic array with a battery is nearer 40-60%. An earlier version read
  // "your panels could cover about 100% of what you use", which invites the
  // reader to expect a near-zero bill.
  //
  // Computing the true figure is possible — /forecast/solar returns seasonal
  // hourly curves and the load profile returns an hourly distribution — but
  // it is a real piece of work, not a ratio. Until then, say plainly what
  // this number is.
  const annualUseKwh = dailyKwh !== null ? dailyKwh * DAYS_PER_YEAR : null;
  const ratioPct =
    annualSolarKwh !== null && annualUseKwh !== null && annualUseKwh > 0
      ? Math.round((annualSolarKwh / annualUseKwh) * 100)
      : null;

  if (tiles.length === 0) return null;

  return (
    <Card className="border-border">
      <Card.Content className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Estimated
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          Your home, before we connect anything
        </h2>
        <p className="max-w-2xl text-sm text-muted">
          Worked out from your tariff and the system you described. Connect
          your inverter or supplier and these become measured readings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Surface
            key={tile.label}
            variant="secondary"
            className="flex flex-col gap-1 rounded-xl p-4"
          >
            <span
              className="text-xs font-medium"
              style={{ color: tile.tone }}
            >
              {tile.label}
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {tile.value}
              </span>
              <span className="text-xs text-muted">{tile.unit}</span>
            </span>
          </Surface>
        ))}
      </div>

      {ratioPct !== null && (
        <Meter
          // The bar is capped at the track, but the figure beside it is not:
          // an array that out-generates the home is worth saying out loud.
          value={Math.min(100, ratioPct)}
          maxValue={100}
          aria-label="A year of generation compared with a year of usage"
          className="flex flex-col gap-2"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-foreground">
              Over a year your panels make about{" "}
              <span className="font-semibold tabular-nums">{ratioPct}%</span> of
              what your home uses
            </span>
            <span className="text-xs text-muted tabular-nums">
              {Math.round(annualSolarKwh ?? 0).toLocaleString()} vs{" "}
              {Math.round(annualUseKwh ?? 0).toLocaleString()} kWh
            </span>
          </div>
          <Meter.Track className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
            <Meter.Fill
              className="h-full rounded-full"
              style={{ backgroundColor: "var(--efh-solar)" }}
            />
          </Meter.Track>
          <p className="text-xs text-muted">
            Totals for the year, not how much you&rsquo;d actually use
            yourself &mdash; panels generate around midday and in summer, so
            some of it gets exported rather than used at home.
          </p>
        </Meter>
      )}
      </Card.Content>
    </Card>
  );
}
