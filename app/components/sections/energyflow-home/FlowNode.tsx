import type { CSSProperties, ReactNode } from "react";

/**
 * A single ring-node in the {@link EnergyFlowDiagram} — Solar / Battery /
 * Grid / Home. The visual language (ring color + soft glow) is derived from
 * a semantic {@link FlowNodeTone}, which resolves to a scoped CSS variable
 * (`--efh-*`, defined in globals.css under `.efh-scope`). Nothing here
 * references raw color values, so a theme change is a one-file edit.
 */

export type FlowNodeTone = "solar" | "battery" | "grid" | "home" | "muted";

const TONE_VAR: Record<FlowNodeTone, string> = {
  solar: "var(--efh-solar)",
  battery: "var(--efh-battery)",
  grid: "var(--efh-grid)",
  home: "var(--efh-home)",
  muted: "var(--muted)",
};

export interface FlowNodeProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: FlowNodeTone;
  /** Small badge above the value — e.g. "↓ 69%" for a discharging battery. */
  meta?: string;
}

export function FlowNode({ icon, label, value, sub, tone, meta }: FlowNodeProps) {
  // A local CSS variable lets a single color drive the ring border, the icon
  // color, and the glow's tint from one declaration.
  const ringStyle: CSSProperties = { ["--ring" as string]: TONE_VAR[tone] };

  return (
    <div className="flex w-24 flex-col items-center gap-1.5 text-center">
      <div
        style={ringStyle}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 bg-surface border-[color:var(--ring)] text-[color:var(--ring)] shadow-[0_0_24px_-6px_var(--ring)]"
      >
        {icon}
      </div>
      {meta && (
        <div className="text-[10px] font-semibold text-success">{meta}</div>
      )}
      <div className="text-xs font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </div>
      {sub && (
        <div className="text-[10px] leading-tight text-muted">{sub}</div>
      )}
    </div>
  );
}
