"use client";
"use no memo";

import { Card, Chip } from "@heroui/react";
import {
  DEFAULT_FLOW_RATE,
  EnergyFlowDiagram as BaseEnergyFlowDiagram,
  fromSigned,
  GridIcon,
  HomeIcon,
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
 * Fixed palette matching the mobile EnergieBee energy-flow card
 * (energiebeemobile → phase1/presentation/widgets/solar/energy_flow_card.dart).
 * Each role gets a distinct hue so the direction of energy is legible from
 * colour alone, not just from the arrow direction. Web and mobile now
 * render identical colours for the same flow.
 *
 * Grid export uses the light-mode teal from mobile's shared chart
 * palette (`chartPalette.export` = #00695C). Mobile swaps it to #3FCBB4
 * in dark mode; if this dashboard grows a dark theme, wire the same
 * swap through globals.css rather than hard-coding two hexes here.
 */
const PALETTE: EnergyFlowPalette = {
  gridImport: "#EF4444", // red — importing costs money
  gridExport: "#00695C", // teal — exporting earns
  solar: "#F59E0B", // amber — generation
  batteryIn: "#6366F1", // indigo — charging
  batteryOut: "#A78BFA", // light violet — discharging
  lowCarbon: "#059669", // green — clean supply
  individuals: ["#D0CC5B", "#964CB5"],
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
                // Library defaults use `palette.gridImport` for BOTH the Grid
                // AND Home icons. That was fine when gridImport was blue,
                // but the mobile palette makes it a saturated red — which
                // then rendered the Home hexagon's glyph as an "alert red",
                // reading as an error where there's actually no issue.
                //   • Grid icon → foreground text, matching every other
                //     hexagon's icon tone. The red is still carried by the
                //     grid → home edge, which is where "import" belongs.
                //   • Home icon → the same rose that drives Home's ring
                //     border, so the icon reads as part of the "consumption"
                //     channel instead of as an alarm.
                grid={{
                  icon: <GridIcon size={27} color="var(--foreground)" />,
                }}
                home={{
                  icon: <HomeIcon size={27} color="var(--efh-home)" />,
                }}
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
                  // Match mobile's `energy_flow_card.dart`, which uses the
                  // library defaults: 2 for the plain hexagon border, 4 for
                  // Home's segmented consumption ring. The thicker ring on
                  // Home reads as a distinct "consumption meter" band
                  // instead of a hairline that blends into the outline.
                  borderWidth: 2,
                  ringWidth: 4,
                  // Every node at 93×93 (library default is 80×80). Extra
                  // breathing room across the whole diagram — the Battery in
                  // particular carries three stacked readings (discharge,
                  // SOC overlay, charge) and was cramped at the default.
                  nodeSize: { width: 93, height: 93 },
                  // +5 over the library default (22) so every glyph reads
                  // at the same slightly-larger size the nodes now use.
                  iconSize: 27,
                  // Values inside each node ("680 W", "→ 6.8 kW", etc.):
                  // −2 from library default (12→10) so they don't crowd
                  // the hex outline on the Battery node's three-row stack,
                  // + semibold + explicit foreground so plain-text lines
                  // (Solar's "680 W", Home's "260 W") read as prominent
                  // instead of thin-and-grey. Colored lines still win
                  // their per-line palette hue via `line.color`.
                  valueStyle: {
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--foreground)",
                  },
                  // Labels under each node ("Solar", "Grid", "Home",
                  // "Battery"): semibold foreground so the names sit at
                  // the same visual weight as the values above, instead
                  // of the library's browser-default light grey.
                  labelStyle: {
                    fontWeight: 600,
                    color: "var(--foreground)",
                  },
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
