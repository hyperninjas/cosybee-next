"use client";
"use no memo";

import { Card, Chip } from "@heroui/react";
import {
  DEFAULT_FLOW_RATE,
  EnergyFlowDiagram as BaseEnergyFlowDiagram,
  fromSigned,
  wattsFormat,
  type EnergyFlowInput,
  type EnergyFlowPalette,
} from "@/app/components/energy-flow-diagram";
import type { EnergyFlowSnapshot } from "./types";

/**
 * Dashboard wrapper around the reusable `energy-flow-diagram` module.
 *
 * The vendored module (see {@link ../../energy-flow-diagram}) owns the
 * animated diagram itself — solver, layout, ring, dots. This file's job is
 * only to:
 *
 *   1. Present the diagram inside the dashboard's HeroUI `Card` shell, so
 *      spacing, title, and the "Updated N h ago" chip match the rest of
 *      the dashboard.
 *   2. Translate the app's {@link EnergyFlowSnapshot} shape (unsigned watts
 *      + explicit direction) into the module's `EnergyFlowInput` shape
 *      (signed watts) via `fromSigned` — same unit the mobile card uses,
 *      so both surfaces render identical numbers.
 *   3. Wire the palette to the site's semantic tokens so the
 *      rings and flow lines follow the active theme without touching this
 *      file.
 *
 * Everything downstream — the diagram, the maths, the animation — stays in
 * the vendor module and is reusable from any other page.
 */

function relativeUpdate(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} h ago`;
}

/**
 * Snapshot → library input. The library is unit-agnostic: whatever unit the
 * values are fed in, the same unit is what the paired `ValueFormat` renders.
 *
 * We feed **raw watts** and pair with `wattsFormat` below — matching the
 * mobile app's `energy_flow_card.dart`, so both surfaces show identical
 * numbers (a 260 W reading reads "260 W", not "0.3 kW" as it would if we
 * scaled to kilowatts up-front and used the coarser `kilowattsFormat`).
 * Above 1 kW the format auto-scales to "1.3 kW", same as mobile.
 *
 * Signing: physics conventions (positive grid = import, positive battery =
 * discharge — matching library defaults `gridPositiveIsExport: false` and
 * `batteryPositiveIsCharge: false`). Our snapshot carries unsigned watts
 * plus an explicit direction, so we sign it here.
 */
function toEnergyFlowInput(flow: EnergyFlowSnapshot): EnergyFlowInput {
  const gridSigned =
    flow.grid.direction === "out"
      ? -flow.grid.watts
      : flow.grid.direction === "in"
        ? flow.grid.watts
        : 0;
  const batterySigned =
    flow.battery.direction === "out"
      ? flow.battery.watts
      : flow.battery.direction === "in"
        ? -flow.battery.watts
        : 0;

  return fromSigned({
    gridPower: gridSigned,
    solarProduction: flow.solar.watts,
    batteryPower: batterySigned,
    batteryStateOfCharge: flow.battery.soc,
    // Backend measures the house directly — render THAT rather than the value
    // the solver would derive from grid + solar + battery. The two agree when
    // the meter agrees with the sum; they disagree by exactly `system
    // OverheadWatts`, which the caption below discloses. Matches mobile's
    // `homeOverride: rt.houseKw`.
    homeOverride: flow.home.watts,
    // Sensor noise below 10 W is treated as idle, so we don't animate a
    // phantom flow. Matches mobile's `_noiseFloorWatts`.
    gridZeroTolerance: 10,
    solarZeroTolerance: 10,
    batteryZeroTolerance: 10,
    // Only pass the optional low-carbon / individual-load inputs when
    // they are populated on the snapshot — the library hides the
    // corresponding hex if the input is undefined.
    ...(flow.nonFossilPercentage !== undefined
      ? { nonFossilPercentage: flow.nonFossilPercentage }
      : {}),
    ...(flow.individuals && flow.individuals.length > 0
      ? {
          individuals: flow.individuals.map((load) => ({
            label: load.label,
            value: load.watts,
          })),
        }
      : {}),
    // Grid is a single BI-DIRECTIONAL connection at the meter — the same
    // wire carries import and export, never at the same instant. The
    // library draws export as a reverse arrow on the grid link when this
    // is false, which is what the client asked for (splitting import and
    // export into two hexagons reads as two physical connections and
    // misrepresents the meter). Daily import/export totals still live
    // separately on the stat strip, where cumulative kWh in each
    // direction is a genuinely useful two-number breakdown.
    showExportNode: false,
  });
}

/**
 * Semantic tokens the site already defines under `.efh-scope` in
 * globals.css. Import / export share the grid hue (we only publish one
 * "grid" token), and the battery in/out share the battery hue for the
 * same reason. When a future palette adds distinct export / discharge
 * tokens, wire them here — nothing else needs to change.
 *
 * 🔴 Solar stays on the theme token — an earlier pass pinned it to
 * `#ff9800` for the solar node, but the same entry drives the SOLAR
 * SEGMENT on the home node's consumption ring (see `EnergyNodeView.tsx`
 * → `push(ringShares.solar, style.palette.solar)`), so a saturated
 * amber wrapped the entire home node whenever solar was supplying the
 * house. Palette must stay a single per-source colour until the library
 * grows a separate "solar-ring" key.
 */
const PALETTE: EnergyFlowPalette = {
  gridImport: "var(--efh-grid)",
  gridExport: "var(--efh-grid)",
  solar: "var(--efh-solar)",
  batteryIn: "var(--efh-battery)",
  batteryOut: "var(--efh-battery)",
  lowCarbon: "var(--success)",
  individuals: ["var(--efh-home)", "var(--warning)"],
};

export interface EnergyFlowDiagramProps {
  flow: EnergyFlowSnapshot;
  /** Injected so the wrapper stays a pure render — no Date.now(). */
  now: Date;
  /**
   * When "offline" the diagram is SUPPRESSED and only the header + a "no
   * recent data" caption render. Matches the mobile card's behaviour: a
   * dead inverter must not animate a last-known frame as though it were live.
   * "fresh" / "stale" render normally (the "stale" grey overlay is a future
   * refinement — the caption already flags the age).
   */
  freshness?: "fresh" | "stale" | "offline" | "awaitingFirstData";
}

/** Sub-noise-floor threshold for showing the overhead caption. */
const OVERHEAD_MIN_W = 10;

export function EnergyFlowDiagram({ flow, now, freshness = "fresh" }: EnergyFlowDiagramProps) {
  const input = toEnergyFlowInput(flow);
  const isOffline = freshness === "offline" || freshness === "awaitingFirstData";
  const overhead = flow.systemOverheadWatts ?? 0;

  return (
    <Card variant="default" className="flex h-full w-full flex-col">
      <Card.Header className="flex-row items-start justify-between gap-2">
        <div>
          <Card.Title>Energy Flow Diagram</Card.Title>
          <Card.Description>Power movement through your home</Card.Description>
        </div>
        <Chip
          color={freshness === "fresh" ? "success" : freshness === "stale" ? "warning" : "danger"}
          variant="soft"
          size="sm"
        >
          <span
            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${
              freshness === "fresh"
                ? "bg-success"
                : freshness === "stale"
                  ? "bg-warning"
                  : "bg-danger"
            }`}
          />
          {freshness === "awaitingFirstData"
            ? "Awaiting first reading"
            : `Updated ${relativeUpdate(flow.updatedAt, now)}`}
        </Chip>
      </Card.Header>

      <Card.Content>
        <div className="mx-auto w-full max-w-130">
          {isOffline ? (
            // Mirrors mobile: a dead inverter must not show a diagram. The
            // last frame's numbers would look identical to a healthy system
            // and quietly mislead. Show the age instead so the user knows to
            // check the inverter / dongle.
            <div className="rounded-lg border border-dashed border-default-300 p-6 text-center text-sm text-default-500">
              No recent data from the inverter. Check the inverter or its
              dongle — the last reading is more than 20 minutes old.
            </div>
          ) : (
            <>
              {/* No battery in/out words. The arrows + colours carry the
                  direction, and dropping the words stops "0.0 kW out" from
                  being clipped inside the hexagon at the dashboard column's
                  width. Set inLabel/outLabel to bring the words back if the
                  node is ever made wider. */}
              <BaseEnergyFlowDiagram
                input={input}
                style={{
                  palette: PALETTE,
                  // Matches mobile: raw watts below 1 kW ("260 W"), one decimal
                  // of kW above ("1.3 kW"). Values are fed in watts in
                  // `toEnergyFlowInput` above.
                  format: wattsFormat({ baseDecimals: 0, kiloDecimals: 1 }),
                  // Domestic throughput range in watts (50 W → 5 kW). The library
                  // default is 0.01 → 2000, which was tuned for kW inputs and
                  // pinned every dot to the slowest speed once we started
                  // feeding it watts. Mirrors mobile's `FlowRate(50, 5000)`.
                  flowRate: { ...DEFAULT_FLOW_RATE, minExpected: 50, maxExpected: 5000 },
                  // Node border thickness — client-specified 1.5.
                  //
                  // 🔴 The Home node draws a SEGMENTED consumption ring
                  // instead of a plain border (`!hasRing && borderWidth > 0`
                  // in EnergyNodeView.tsx), so `borderWidth` alone would
                  // leave Home on the library-default `ringWidth: 4`.
                  // Match the two so every node — Home included — reads
                  // at the same 1.5 stroke.
                  borderWidth: 1.5,
                  ringWidth: 1.5,
                }}
              />
              {overhead >= OVERHEAD_MIN_W && (
                // Mirrors the mobile card's "Your inverter uses N W of this
                // itself" caption. Self-hides below the noise floor — matches
                // `_SystemOverheadNote` in `energy_flow_card.dart`.
                <p className="mt-2 text-center text-xs text-default-500">
                  Your inverter uses {Math.round(overhead)} W of this itself —
                  standby power and conversion loss.
                </p>
              )}
            </>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
