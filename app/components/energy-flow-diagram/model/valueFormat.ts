/** The three unit suffixes a `ValueFormat` steps through as magnitude grows. */
export interface ValueUnits {
  /** Suffix below the kilo threshold. */
  readonly base: string;
  /** Suffix between the kilo and mega thresholds. */
  readonly kilo: string;
  /** Suffix at or above the mega threshold. */
  readonly mega: string;
}

export const WATT_HOURS: ValueUnits = { base: "Wh", kilo: "kWh", mega: "MWh" };
/** For sources that already report in kWh. */
export const KILOWATT_HOURS: ValueUnits = { base: "kWh", kilo: "MWh", mega: "GWh" };
export const WATTS: ValueUnits = { base: "W", kilo: "kW", mega: "MW" };
/** For sources that already report in kW. */
export const KILOWATTS: ValueUnits = { base: "kW", kilo: "MW", mega: "GW" };

/**
 * Formats the diagram's raw numbers for display.
 *
 * Mirrors the reference card: a value is compared against a kilo and a mega
 * threshold expressed in the **base** unit, then scaled and rounded with a
 * per-magnitude decimal count.
 *
 * The reference card renders the absolute value unless negatives are explicitly
 * accepted; `acceptNegative` reproduces that.
 */
export interface ValueFormat {
  readonly units: ValueUnits;
  /** Decimals used below `kiloThreshold`. */
  readonly baseDecimals: number;
  /** Decimals used between `kiloThreshold` and `megaThreshold`. */
  readonly kiloDecimals: number;
  /** Decimals used at or above `megaThreshold`. */
  readonly megaDecimals: number;
  readonly kiloThreshold: number;
  readonly megaThreshold: number;
  /** Keep the sign instead of rendering the magnitude. */
  readonly acceptNegative: boolean;
  /** Inserted between the number and the unit. Empty string joins them. */
  readonly unitSeparator: string;
  /** Locale tag for digit grouping and the decimal separator. */
  readonly locale?: string;
}

/** The defaults match the reference card: watt-hours, 0 decimals, 1 above 1 kWh. */
export const DEFAULT_FORMAT: ValueFormat = {
  units: WATT_HOURS,
  baseDecimals: 0,
  kiloDecimals: 1,
  megaDecimals: 2,
  kiloThreshold: 1000,
  megaThreshold: 1000000,
  acceptNegative: false,
  unitSeparator: " ",
};

/** A format for readings already supplied in kilowatts, e.g. a live power feed. */
export const kilowattsFormat = (
  overrides: Partial<ValueFormat> = {},
): ValueFormat => ({
  ...DEFAULT_FORMAT,
  units: KILOWATTS,
  baseDecimals: 1,
  kiloDecimals: 2,
  ...overrides,
});

/** A format for readings already supplied in kilowatt-hours. */
export const kilowattHoursFormat = (
  overrides: Partial<ValueFormat> = {},
): ValueFormat => ({
  ...DEFAULT_FORMAT,
  units: KILOWATT_HOURS,
  baseDecimals: 1,
  kiloDecimals: 2,
  ...overrides,
});

/** A format for live watts. */
export const wattsFormat = (overrides: Partial<ValueFormat> = {}): ValueFormat => ({
  ...DEFAULT_FORMAT,
  units: WATTS,
  ...overrides,
});

/** Half-away-from-zero rounding at `places` decimals. */
function roundTo(value: number, places: number): number {
  if (places <= 0) return Math.round(Math.abs(value)) * Math.sign(value || 1) || 0;
  let factor = 1;
  for (let i = 0; i < places; i++) factor *= 10;
  const scaled = value * factor;
  // `Math.round` is half-UP, not half-away-from-zero, so negatives need the
  // magnitude rounded and the sign reattached — otherwise -0.5 rounds to -0
  // where Dart's `roundToDouble` gives -1.
  const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled));
  return rounded / factor;
}

function formatNumber(value: number, places: number, locale?: string): string {
  const safePlaces = places < 0 ? 0 : places;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: safePlaces,
    maximumFractionDigits: safePlaces,
  }).format(value);
}

/**
 * Formats `value`, optionally forcing a `unit` and `decimals`.
 *
 * When `unit` is supplied no magnitude scaling happens — the number is shown
 * as-is with that suffix, which is how per-entity unit overrides behave in the
 * reference card.
 */
export function formatValue(
  format: ValueFormat,
  value: number | null | undefined,
  options: { unit?: string; decimals?: number } = {},
): string {
  const { unit, decimals } = options;
  const join = (n: string, u: string): string =>
    u.length === 0 ? n : `${n}${format.unitSeparator}${u}`;

  if (value === null || value === undefined || !Number.isFinite(value)) {
    return join(
      formatNumber(0, decimals ?? format.baseDecimals, format.locale),
      unit ?? format.units.base,
    );
  }

  const scale = unit === undefined;
  const isMega = scale && Math.abs(value) >= format.megaThreshold;
  const isKilo = scale && !isMega && Math.abs(value) >= format.kiloThreshold;

  const scaled = isMega ? value / 1000000 : isKilo ? value / 1000 : value;

  const places =
    decimals ??
    (isMega ? format.megaDecimals : isKilo ? format.kiloDecimals : format.baseDecimals);

  const rounded = roundTo(scaled, places);
  const display = format.acceptNegative ? rounded : Math.abs(rounded);

  const suffix =
    unit ?? (isMega ? format.units.mega : isKilo ? format.units.kilo : format.units.base);

  return join(formatNumber(display, places, format.locale), suffix);
}
