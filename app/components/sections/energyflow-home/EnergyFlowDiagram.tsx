"use client";

import { Card, Chip } from "@heroui/react";
import {
  EnergyFlowDiagram as BaseEnergyFlowDiagram,
  fromSigned,
  kilowattsFormat,
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
 *      (signed kilowatts) via `fromSigned`.
 *   3. Wire the palette to the site's semantic tokens (`--efh-*`) so the
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
 * Snapshot → library input. The library takes *signed* kilowatts using
 * physics conventions (positive grid = import, positive battery =
 * discharge — matching the library defaults `gridPositiveIsExport: false`
 * and `batteryPositiveIsCharge: false`). Our snapshot carries unsigned
 * watts plus an explicit direction, so we sign it here.
 */
function toEnergyFlowInput(flow: EnergyFlowSnapshot): EnergyFlowInput {
  const gridKw = flow.grid.watts / 1000;
  const solarKw = flow.solar.watts / 1000;
  const batteryKw = flow.battery.watts / 1000;

  const gridSigned =
    flow.grid.direction === "out"
      ? -gridKw
      : flow.grid.direction === "in"
        ? gridKw
        : 0;
  const batterySigned =
    flow.battery.direction === "out"
      ? batteryKw
      : flow.battery.direction === "in"
        ? -batteryKw
        : 0;

  return fromSigned({
    gridPower: gridSigned,
    solarProduction: solarKw,
    batteryPower: batterySigned,
    batteryStateOfCharge: flow.battery.soc,
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
            value: load.watts / 1000,
          })),
        }
      : {}),
    showExportNode: true,
  });
}

/**
 * Semantic tokens the site already defines under `.efh-scope` in
 * globals.css. Import / export share the grid hue (we only publish one
 * "grid" token), and the battery in/out share the battery hue for the
 * same reason. When a future palette adds distinct export / discharge
 * tokens, wire them here — nothing else needs to change.
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
}

export function EnergyFlowDiagram({ flow, now }: EnergyFlowDiagramProps) {
  const input = toEnergyFlowInput(flow);

  return (
    <Card variant="default" className="flex h-full w-full flex-col">
      <Card.Header className="flex-row items-start justify-between gap-2">
        <div>
          <Card.Title>Energy Flow Diagram</Card.Title>
          <Card.Description>Power movement through your home</Card.Description>
        </div>
        <Chip color="success" variant="soft" size="sm">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success align-middle" />
          Updated {relativeUpdate(flow.updatedAt, now)}
        </Chip>
      </Card.Header>

      <Card.Content>
        <div className="mx-auto w-full max-w-130">
          {/* No battery in/out words. The arrows + colours carry the
              direction, and dropping the words stops "0.0 kW out" from
              being clipped inside the hexagon at the dashboard column's
              width. Set inLabel/outLabel to bring the words back if the
              node is ever made wider. */}
          <BaseEnergyFlowDiagram
            input={input}
            style={{
              palette: PALETTE,
              format: kilowattsFormat(),
            }}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
