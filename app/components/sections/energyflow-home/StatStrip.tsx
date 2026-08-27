import { Card } from "@heroui/react";
import {
  ArrowDown,
  ArrowUp,
  HouseFill,
  PlugConnection,
  Sun,
} from "@gravity-ui/icons";
import type { StatTile } from "./types";

/**
 * The five-tile strip along the bottom of the dashboard. Deliberately
 * minimal — the reference mockup wins with restraint, not decoration:
 *
 *   • Icon + colored label inline, no badge circles, no top accent rails.
 *   • Big bold value with a small muted unit trailing it.
 *   • Optional muted sub line.
 *   • Tiles separated by hairlines only, so the strip reads as one card.
 *
 * All four "energy in the right direction" channels sit on the success axis
 * (with a slight amber lean for solar and sky lean for grid — kept only so
 * the flow diagram's rings stay distinguishable). Home is the sole rose
 * channel — the "consumption" cue. Every color routes through the scoped
 * `--efh-*` channel tokens plus semantic theme tokens; no color literals.
 */

type Tone = StatTile["tone"];

const TONE_ICON: Record<Tone, React.ReactElement> = {
  solar: <Sun className="size-4" />,
  "grid-import": <ArrowDown className="size-4" />,
  battery: <PlugConnection className="size-4" />,
  home: <HouseFill className="size-4" />,
  "grid-export": <ArrowUp className="size-4" />,
};

const TONE_COLOR: Record<Tone, string> = {
  solar: "var(--efh-solar)",
  "grid-import": "var(--efh-battery)",
  battery: "var(--efh-battery)",
  home: "var(--efh-home)",
  "grid-export": "var(--efh-battery)",
};

export function StatStrip({ stats }: { stats: StatTile[] }) {
  return (
    <Card variant="default" className="overflow-hidden">
      <Card.Content className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((tile, i) => (
            <div
              key={tile.key}
              // `color:` on the wrapper is what tints the icon (via
              // currentColor) AND the label. One declaration, one source
              // of truth per tile.
              style={{ color: TONE_COLOR[tile.tone] }}
              className={`px-6 py-5 ${
                i > 0 ? "lg:border-l lg:border-separator" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {TONE_ICON[tile.tone]}
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {tile.label}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1 text-foreground">
                <span className="text-2xl font-bold tabular-nums leading-none">
                  {tile.value}
                </span>
                <span className="text-xs font-medium text-muted">
                  {tile.unit}
                </span>
              </div>

              {tile.sub && (
                <div className="mt-2 text-[11px] leading-snug text-muted">
                  {tile.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
