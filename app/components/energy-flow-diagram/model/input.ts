import type { IndividualLoad } from "./types";

/**
 * The raw readings fed into `solve`.
 *
 * Every value must be expressed in the **same unit**. The package is unit
 * agnostic: pass watt-hours for an energy diagram (matching the Home Assistant
 * card) or watts/kilowatts for a live power diagram. Only `ValueFormat` decides
 * how those numbers are rendered.
 *
 * All directional readings are **unsigned magnitudes**: `gridImport` and
 * `gridExport` are both positive, as are `batteryCharge` and
 * `batteryDischarge`. If your data source reports a single signed figure, use
 * {@link fromSigned}.
 */
export interface EnergyFlowInput {
  /** Drawn from the grid. `undefined` means "no grid node configured". */
  readonly gridImport?: number;
  /** Returned to the grid. `undefined` means the grid is import-only. */
  readonly gridExport?: number;
  /** Total solar production. `undefined` means "no solar node configured". */
  readonly solarProduction?: number;
  readonly batteryCharge?: number;
  readonly batteryDischarge?: number;
  /** Battery state of charge, as a percentage. Purely presentational. */
  readonly batteryStateOfCharge?: number;
  /**
   * Share of the grid import that is low-carbon, 0-100. `undefined` hides the
   * low-carbon node. To derive it from a high-carbon figure, use
   * {@link nonFossilPercentageFromHighCarbon}.
   */
  readonly nonFossilPercentage?: number;
  /** Replaces the computed home consumption with an explicit reading. */
  readonly homeOverride?: number;
  /** Whether individual loads should be subtracted from the home figure. */
  readonly subtractIndividual?: boolean;
  readonly isPowerOutage?: boolean;
  /** Generator output to attribute to the grid node during an outage. */
  readonly outageGeneration?: number;
  readonly individuals?: readonly IndividualLoad[];
  /** Grid readings at or below this are treated as zero. */
  readonly gridZeroTolerance?: number;
  readonly solarZeroTolerance?: number;
  readonly batteryZeroTolerance?: number;
  /**
   * Draws grid export as its own destination node instead of as a reverse
   * arrow inside the grid node.
   *
   * Off by default, so existing diagrams are untouched. Turn it on for a system
   * that genuinely exports: energy leaving the property is then drawn as a flow
   * *to somewhere*, which is what it is.
   *
   * 🔴 Deliberately a property of the **system**, not of the current reading.
   * Keying it to `gridExport > 0` would make the node — and every node below it
   * — appear and vanish each time the sign of the grid reading flipped, which on
   * a real installation is many times an hour.
   */
  readonly showExportNode?: boolean;
}

/** Readings in the signed shape most live-power APIs use. */
export interface SignedEnergyFlowInput
  extends Omit<
    EnergyFlowInput,
    "gridImport" | "gridExport" | "batteryCharge" | "batteryDischarge"
  > {
  /** Positive when importing, negative when exporting. */
  readonly gridPower?: number;
  /** Positive when DISCHARGING, negative when charging. */
  readonly batteryPower?: number;
  /** Flips the grid convention. */
  readonly gridPositiveIsExport?: boolean;
  /** Flips the battery convention. */
  readonly batteryPositiveIsCharge?: boolean;
}

/**
 * Converts signed readings into the unsigned magnitudes the solver wants.
 *
 * 🔴 Check which convention your source uses. `batteryPositiveIsCharge`
 * defaults to false — positive means DISCHARGING — and getting it backwards is
 * self-concealing: every number stays individually correct while the battery is
 * drawn charging when it is discharging, so the diagram reads as though the
 * house value were wrong rather than one sign.
 */
export function fromSigned(input: SignedEnergyFlowInput): EnergyFlowInput {
  const {
    gridPower,
    batteryPower,
    gridPositiveIsExport = false,
    batteryPositiveIsCharge = false,
    ...rest
  } = input;

  const grid = gridPower === undefined ? 0 : gridPositiveIsExport ? -gridPower : gridPower;
  const battery =
    batteryPower === undefined ? 0 : batteryPositiveIsCharge ? -batteryPower : batteryPower;

  return {
    ...rest,
    ...(gridPower === undefined
      ? {}
      : { gridImport: grid > 0 ? grid : 0, gridExport: grid < 0 ? -grid : 0 }),
    ...(batteryPower === undefined
      ? {}
      : {
          batteryCharge: battery < 0 ? -battery : 0,
          batteryDischarge: battery > 0 ? battery : 0,
        }),
  };
}

export const hasGrid = (i: EnergyFlowInput): boolean =>
  i.gridImport !== undefined || i.gridExport !== undefined;

export const hasExportNode = (i: EnergyFlowInput): boolean =>
  (i.showExportNode ?? false) && i.gridExport !== undefined;

export const hasSolar = (i: EnergyFlowInput): boolean => i.solarProduction !== undefined;

export const hasBattery = (i: EnergyFlowInput): boolean =>
  i.batteryCharge !== undefined || i.batteryDischarge !== undefined;

export const hasLowCarbon = (i: EnergyFlowInput): boolean =>
  i.nonFossilPercentage !== undefined && !(i.isPowerOutage ?? false);

/**
 * Converts a high-carbon consumption figure into the low-carbon percentage
 * `nonFossilPercentage` expects.
 *
 * Mirrors the reference card, which derives the split from the CO2-Signal
 * integration's fossil total. Both figures must share a unit.
 */
export function nonFossilPercentageFromHighCarbon(
  highCarbon: number,
  gridImport: number,
): number {
  if (gridImport <= 0) return 0;
  const nonFossil = Math.min(Math.max(gridImport - highCarbon, 0), gridImport);
  return (nonFossil / gridImport) * 100;
}
