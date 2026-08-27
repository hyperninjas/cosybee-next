import { Card, Chip } from "@heroui/react";
import {
  HouseFill,
  PlugConnection,
  Sun,
  ThunderboltFill,
} from "@gravity-ui/icons";
import { FlowNode } from "./FlowNode";
import { FlowConnections } from "./FlowConnections";
import type { EnergyFlowSnapshot } from "./types";

/**
 * The big left-column card of the dashboard: a radial "energy hub" showing
 * Solar / Battery / Grid feeding a central net node that drives the Home
 * load. Uses HeroUI's compound-card composition
 * (`Card.Header` / `Card.Title` / `Card.Description` / `Card.Content`) so
 * spacing and semantics come from the design system rather than ad-hoc
 * className strings. All color decisions route through theme tokens.
 */

function formatWatts(watts: number): string {
  if (watts === 0) return "0 W";
  if (Math.abs(watts) >= 1000) return `${(watts / 1000).toFixed(2)} kW`;
  return `${Math.round(watts)} W`;
}

function relativeUpdate(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} h ago`;
}

// Central "net" hub tone. Each state resolves to a semantic token; the glow
// tints itself off the same color via `currentColor`, so a theme change
// re-tints the hub without touching this file.
const NET_TONE_CLASSES: Record<EnergyFlowSnapshot["netTone"], string> = {
  positive:
    "border-success text-success shadow-[0_0_30px_-4px_currentColor]",
  neutral: "border-border text-foreground",
  negative:
    "border-danger text-danger shadow-[0_0_30px_-4px_currentColor]",
};

export interface EnergyFlowDiagramProps {
  flow: EnergyFlowSnapshot;
  /** Injected so the component stays a pure server render — no Date.now(). */
  now: Date;
}

export function EnergyFlowDiagram({ flow, now }: EnergyFlowDiagramProps) {
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
        <div className="relative mx-auto flex h-[360px] w-full max-w-[520px] items-center justify-center">
          {/* Solar (top) */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <FlowNode
              icon={<Sun className="size-5" />}
              label="Solar"
              value={formatWatts(flow.solar.watts)}
              tone="solar"
            />
          </div>

          {/* Battery (left) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <FlowNode
              icon={<PlugConnection className="size-5" />}
              label="Battery"
              value={formatWatts(flow.battery.watts)}
              sub={flow.battery.label}
              tone="battery"
              meta={`${flow.battery.direction === "out" ? "↓" : "↑"} ${flow.battery.soc}%`}
            />
          </div>

          {/* Grid (right) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <FlowNode
              icon={<ThunderboltFill className="size-5" />}
              label="Grid"
              value={formatWatts(flow.grid.watts)}
              tone="grid"
            />
          </div>

          {/* Home (bottom) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <FlowNode
              icon={<HouseFill className="size-5" />}
              label="Home Load"
              value={formatWatts(flow.home.watts)}
              tone="home"
            />
          </div>

          {/* Central "net" hub */}
          <div
            className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-2 bg-background text-center ${NET_TONE_CLASSES[flow.netTone]}`}
          >
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted">
                Net
              </div>
              <div className="text-sm font-bold">
                {flow.netLabel.replace(/^Net\s*/i, "")}
              </div>
            </div>
          </div>

          <FlowConnections flow={flow} />
        </div>
      </Card.Content>
    </Card>
  );
}
