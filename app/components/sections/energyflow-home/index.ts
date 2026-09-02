/**
 * Public entry point for the Energy Flow Home dashboard module. Everything
 * a caller (a page, a story, a test) should import comes from this file so
 * the internal component layout can move around without ripple.
 */
export { ConnectionEmptyState } from "./ConnectionEmptyState";
export { DashboardHeader } from "./DashboardHeader";
export { ProviderStatusBar } from "./ProviderStatusBar";
export { EnergyFlowDiagram } from "./EnergyFlowDiagram";
export { EnergyFlowDiagramLive } from "./EnergyFlowDiagramLive";
export { PropertySwitcher } from "./PropertySwitcher";
export { TariffCard } from "./TariffCard";
export { DailyCostCard } from "./DailyCostCard";
export { StatStrip } from "./StatStrip";
export { PowerHistoryChart } from "./PowerHistoryChart";
export { DashboardShell } from "./DashboardShell";
export { SyncingDataBanner } from "./SyncingDataBanner";
export { getDashboardData } from "./data";
export type {
  BatteryState,
  DailyCost,
  DashboardData,
  EnergyFlowSnapshot,
  FlowChannel,
  FlowDirection,
  PowerHistory,
  PowerHistoryPoint,
  StatTile,
  TariffInfo,
} from "./types";
