import type { EnergyFlowInput } from "./input";
import { finite, finiteOrUndefined } from "./finite";
import { hasLowCarbon } from "./input";
import type { EnergyFlowKind } from "./types";

/**
 * The four segments of the home node's consumption ring, as perimeter
 * fractions in the order they are drawn.
 */
export interface HomeRingShares {
  readonly grid: number;
  readonly lowCarbon: number;
  readonly battery: number;
  readonly solar: number;
}

export const EMPTY_RING: HomeRingShares = { grid: 0, lowCarbon: 0, battery: 0, solar: 0 };

export const ringIsEmpty = (s: HomeRingShares): boolean =>
  s.grid + s.lowCarbon + s.battery + s.solar <= 0;

/**
 * The computed energy distribution: how much flows along each edge of the
 * diagram, plus the derived home consumption and ring shares.
 *
 * A faithful port of the allocator in `energy-flow-card-plus` v0.2.3. The
 * algorithm is a greedy, fixed-priority assignment rather than the chain of
 * subtractions used in earlier versions, and it cannot produce negative flows.
 *
 * The allocation order is:
 *
 * 1. Grid charges the battery, but only from import that exceeds home demand.
 * 2. Solar charges the battery.
 * 3. Solar exports to the grid.
 * 4. Battery exports to the grid.
 * 5. Any leftover grid import tops up the battery.
 * 6. Solar serves the home.
 * 7. Battery serves the home.
 * 8. Grid serves the home.
 *
 * Pure: no React, no I/O, no clock. This is the piece to unit test when
 * validating against a reference implementation.
 */
export interface EnergyFlowSolution {
  readonly gridToHome: number;
  readonly gridToBattery: number;
  readonly solarToHome: number;
  readonly solarToGrid: number;
  readonly solarToBattery: number;
  readonly batteryToHome: number;
  readonly batteryToGrid: number;
  /** The low-carbon portion of `gridToHome`. */
  readonly nonFossilToHome: number;
  /** Total home consumption, i.e. everything reaching the home. */
  readonly homeConsumption: number;
  /** The figure on the home node, after `homeOverride`/`subtractIndividual`. */
  readonly displayedHomeConsumption: number;
  readonly totalIndividual: number;
  /** Sum of every edge, the denominator of the legacy flow-rate model. */
  readonly totalLines: number;
  /** Per-load values after tolerance handling, in input order. */
  readonly individuals: readonly number[];
  readonly solarTotal: number;
  readonly gridImport: number;
  readonly gridExport: number;
  readonly batteryCharge: number;
  readonly batteryDischarge: number;
}

/**
 * Applies a `display_zero_tolerance`: values at or below `tolerance` read as
 * zero. A tolerance of zero only suppresses exact zeros.
 */
function tolerate(value: number, tolerance: number): number {
  // 🔴 The finite guard lives HERE, on the one funnel every reading passes
  // through, rather than at seven call sites that could each be forgotten.
  // `Infinity` or `NaN` in a reading used to propagate into every derived
  // figure, into the layout, and finally into an SVG `d` — where the browser
  // silently renders nothing at all.
  if (!Number.isFinite(value)) return 0;
  if (value === 0) return 0;
  const t = Number.isFinite(tolerance) ? tolerance : 0;
  if (t <= 0) return value;
  return value > t ? value : 0;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

/** Runs the allocation for `input`. */
export function solve(input: EnergyFlowInput): EnergyFlowSolution {
  // ── Normalise inputs ──────────────────────────────────────────────────────
  // Negative readings are meaningless for a directional magnitude, and the
  // reference implementation clamps them before allocating.
  const gridZeroTolerance = input.gridZeroTolerance ?? 0;
  const solarZeroTolerance = input.solarZeroTolerance ?? 0;
  const batteryZeroTolerance = input.batteryZeroTolerance ?? 0;

  let gridImport = tolerate(Math.max(input.gridImport ?? 0, 0), gridZeroTolerance);
  let gridExport = tolerate(Math.max(input.gridExport ?? 0, 0), gridZeroTolerance);
  const solarTotal = tolerate(Math.max(input.solarProduction ?? 0, 0), solarZeroTolerance);
  const batteryCharge = tolerate(Math.max(input.batteryCharge ?? 0, 0), batteryZeroTolerance);
  const batteryDischarge = tolerate(
    Math.max(input.batteryDischarge ?? 0, 0),
    batteryZeroTolerance,
  );

  // ── Greedy allocation ─────────────────────────────────────────────────────
  let remainingCharge = batteryCharge;
  let remainingExport = gridExport;
  let remainingSolar = solarTotal;
  let remainingImport = gridImport;
  let remainingDischarge = batteryDischarge;

  // Everything produced or imported, less everything exported or stored.
  let homeDemand = Math.max(
    gridImport + solarTotal + batteryDischarge - gridExport - batteryCharge,
    0,
  );

  // 1. Grid only charges the battery with import beyond what the home needs.
  let gridToBattery = Math.max(0, Math.min(remainingCharge, remainingImport - homeDemand));
  remainingCharge -= gridToBattery;
  remainingImport -= gridToBattery;

  // 2. Solar charges the battery.
  const solarToBattery = Math.min(remainingSolar, remainingCharge);
  remainingSolar -= solarToBattery;
  remainingCharge -= solarToBattery;

  // 3. Solar exports.
  const solarToGrid = Math.min(remainingSolar, remainingExport);
  remainingSolar -= solarToGrid;
  remainingExport -= solarToGrid;

  // 4. Battery exports whatever export is left.
  let batteryToGrid = Math.min(remainingDischarge, remainingExport);
  remainingDischarge -= batteryToGrid;

  // 5. Leftover import tops up the battery.
  const extraGridToBattery = Math.min(remainingImport, remainingCharge);
  gridToBattery += extraGridToBattery;
  remainingImport -= extraGridToBattery;

  // 6-8. Serve the home, solar first, then battery, then grid.
  const solarToHome = Math.min(homeDemand, remainingSolar);
  homeDemand -= solarToHome;

  const batteryToHome = Math.min(homeDemand, remainingDischarge);
  homeDemand -= batteryToHome;

  let gridToHome = Math.min(homeDemand, remainingImport);

  // The battery/grid exchange is suppressed below the coarser of the two
  // tolerances, matching the reference card.
  const exchangeTolerance = Math.max(gridZeroTolerance, batteryZeroTolerance);
  if (gridToBattery <= exchangeTolerance) gridToBattery = 0;
  if (batteryToGrid <= exchangeTolerance) batteryToGrid = 0;

  // ── Power outage override ─────────────────────────────────────────────────
  let outSolarToHome = solarToHome;
  let outSolarToGrid = solarToGrid;
  let outSolarToBattery = solarToBattery;
  let outBatteryToHome = batteryToHome;
  let outBatteryToGrid = batteryToGrid;
  let outGridToBattery = gridToBattery;

  if (input.isPowerOutage ?? false) {
    gridImport = Math.max(finite(input.outageGeneration, 0), 0);
    gridExport = 0;
    gridToHome = gridImport;
    outGridToBattery = 0;
    outBatteryToGrid = 0;
    outBatteryToHome = 0;
    outSolarToGrid = 0;
    outSolarToBattery = 0;
    outSolarToHome = solarTotal;
  }

  // ── Derived figures ───────────────────────────────────────────────────────
  const homeConsumption = Math.max(gridToHome + outSolarToHome + outBatteryToHome, 0);

  const nonFossilPercentage = hasLowCarbon(input)
    ? clamp(finite(input.nonFossilPercentage, 0), 0, 100)
    : 0;
  const nonFossilToHome = (gridToHome * nonFossilPercentage) / 100;

  const individuals = (input.individuals ?? []).map((load) =>
    tolerate(Math.max(load.value, 0), load.displayZeroTolerance ?? 0),
  );
  const totalIndividual = individuals.reduce((sum, v) => sum + v, 0);

  // An unusable override falls back to the computed figure rather than blanking
  // the home node.
  const base = finiteOrUndefined(input.homeOverride) ?? homeConsumption;
  const displayedHomeConsumption = (input.subtractIndividual ?? false)
    ? Math.max(base - totalIndividual, 0)
    : base;

  const totalLines =
    outSolarToHome +
    outSolarToGrid +
    outSolarToBattery +
    outBatteryToHome +
    outGridToBattery +
    outBatteryToGrid +
    gridToHome;

  return {
    gridToHome,
    gridToBattery: outGridToBattery,
    solarToHome: outSolarToHome,
    solarToGrid: outSolarToGrid,
    solarToBattery: outSolarToBattery,
    batteryToHome: outBatteryToHome,
    batteryToGrid: outBatteryToGrid,
    nonFossilToHome,
    homeConsumption,
    displayedHomeConsumption,
    totalIndividual,
    totalLines,
    individuals,
    solarTotal,
    gridImport,
    gridExport,
    batteryCharge,
    batteryDischarge,
  };
}

/** The value carried by a given edge. */
export function flowValue(
  s: EnergyFlowSolution,
  kind: EnergyFlowKind,
  individualIndex = 0,
): number {
  switch (kind) {
    case "gridToHome":
      return s.gridToHome;
    case "gridToBattery":
      return s.gridToBattery;
    case "solarToHome":
      return s.solarToHome;
    case "solarToGrid":
      return s.solarToGrid;
    case "solarToBattery":
      return s.solarToBattery;
    case "batteryToHome":
      return s.batteryToHome;
    case "batteryToGrid":
      return s.batteryToGrid;
    case "individual":
      if (individualIndex < 0 || individualIndex >= s.individuals.length) return 0;
      return s.individuals[individualIndex]!;
  }
}

/**
 * The home ring split, as fractions of the node perimeter summing to <= 1.
 *
 * Ordered the way they should be laid down around the outline. The grid share
 * is the remainder, so rounding never leaves a visible gap.
 */
export function homeRingShares(s: EnergyFlowSolution): HomeRingShares {
  if (s.homeConsumption <= 0) return EMPTY_RING;
  const share = (value: number): number =>
    value <= 0 ? 0 : clamp(value / s.homeConsumption, 0, 1);
  const solar = share(s.solarToHome);
  const battery = share(s.batteryToHome);
  const lowCarbon = share(s.nonFossilToHome);
  const grid = clamp(1 - solar - battery - lowCarbon, 0, 1);
  return { grid, lowCarbon, battery, solar };
}

/** Interpolates two ring splits, so the home node morphs instead of jumping. */
export function lerpRing(a: HomeRingShares, b: HomeRingShares, t: number): HomeRingShares {
  const mix = (x: number, y: number): number => x + (y - x) * t;
  return {
    grid: mix(a.grid, b.grid),
    lowCarbon: mix(a.lowCarbon, b.lowCarbon),
    battery: mix(a.battery, b.battery),
    solar: mix(a.solar, b.solar),
  };
}
