/**
 * Shared types for the Energy Flow Home dashboard module. Every section
 * component in this folder consumes one of these shapes, so a future data
 * source (API, WebSocket, DO snapshot) only has to satisfy this contract.
 */

export type FlowDirection = "in" | "out" | "idle";

export interface FlowChannel {
  /** Instantaneous power in watts. Negative values are not used — direction is explicit. */
  watts: number;
  direction: FlowDirection;
}

export interface BatteryState extends FlowChannel {
  /** State of charge, 0–100. */
  soc: number;
  /** Human label, e.g. "2 × 5.0 kWh Battery". */
  label: string;
}

export interface EnergyFlowSnapshot {
  solar: FlowChannel;
  battery: BatteryState;
  grid: FlowChannel;
  home: FlowChannel;
  /** ISO 8601 timestamp of the sample. */
  updatedAt: string;
  /** Live label, e.g. "Net zero" or "0.14 kW draw". */
  netLabel: string;
  netTone: "positive" | "neutral" | "negative";
}

export interface TariffInfo {
  name: string;
  /** Live import price, pence per kWh. */
  importPence: number;
  /** Export/feed-in price, pence per kWh. */
  exportPence: number;
  /** Daily standing charge, pence per day. */
  standingPence: number;
}

export interface DailyCost {
  /** Net cost for the day in GBP. Positive = you owe, negative = credit. */
  netGbp: number;
  /** Prior day's net cost — powers the trend chip. Optional so first-day
   *  installs render without a delta. */
  prevNetGbp?: number;
  importGbp: number;
  standingGbp: number;
  exportCreditGbp: number;
}

export interface StatTile {
  key: string;
  label: string;
  value: string;
  unit: string;
  sub?: string;
  tone: "solar" | "grid-import" | "battery" | "home" | "grid-export";
}

/**
 * One instantaneous power reading across all four channels, in kilowatts.
 * Battery and grid are signed — positive = flowing out from the house,
 * negative = flowing in — which lets the chart show discharge dips below
 * the axis exactly as the reference does.
 */
export interface PowerHistoryPoint {
  /** Hour label, "0 AM" through "11 PM". Used verbatim on the X-axis. */
  time: string;
  home: number;
  solar: number;
  grid: number;
  battery: number;
}

export interface PowerHistory {
  points: PowerHistoryPoint[];
  /** Window label shown in the header chip. */
  windowLabel: string;
}

export interface DashboardData {
  flow: EnergyFlowSnapshot;
  tariff: TariffInfo;
  cost: DailyCost;
  stats: StatTile[];
  history: PowerHistory;
  /** e.g. "Off-Grid Champion" — null when nothing to celebrate. */
  achievement: { title: string; message: string } | null;
  /** Currently viewed day, ISO date. Used by the date navigator. */
  dayIso: string;
  dayLabel: string;
}
