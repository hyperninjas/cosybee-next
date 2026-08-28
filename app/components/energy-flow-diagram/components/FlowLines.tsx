"use client";
"use no memo";

import { useId } from "react";
import type { FlowEdge } from "../render/flowRoute";

export interface FlowLinesProps {
  readonly edges: readonly FlowEdge[];
  readonly width: number;
  readonly height: number;
  readonly lineWidth: number;
  readonly dotRadius: number;
}

interface DotProps {
  readonly path: string;
  readonly durationMs: number;
  readonly reversed: boolean;
  readonly color: string;
  readonly radius: number;
  readonly phaseKey: string;
}

/**
 * One travelling particle.
 *
 * Uses SVG's native `<animateMotion>` element. The dot is placed on the path
 * from the very first paint by the SMIL runtime itself — no post-mount JS,
 * no `offset-path` compatibility risk, and nothing to hide until an effect
 * has run.
 *
 * `<animateMotion>` restarts if `dur` mutates (a known SMIL quirk the
 * previous WAAPI version was written to sidestep), so the dot's phase resets
 * whenever a reading's flow rate changes. That is fine for a demo dashboard
 * whose numbers are stable per render; when live data lands and readings
 * update every few seconds, revisit this by throttling `durationMs` updates
 * so they don't fire on every polling tick.
 */
function FlowDot({ path, durationMs, reversed, color, radius, phaseKey }: DotProps) {
  const dur = Math.max(1, durationMs);
  return (
    <circle r={radius} fill={color} data-dot={phaseKey}>
      <animateMotion
        dur={`${dur}ms`}
        repeatCount="indefinite"
        path={path}
        // `keyPoints`/`keyTimes` reverses direction without flipping the
        // path itself: for a battery that switches from charging to
        // discharging, the dot travels the same physical line the other way.
        keyPoints={reversed ? "1;0" : "0;1"}
        keyTimes="0;1"
      />
    </circle>
  );
}

/**
 * Paints the flow lines and their travelling dots.
 *
 * Lines are drawn first and dots second, so a dot is never hidden under the
 * line it belongs to.
 */
export function FlowLines({ edges, width, height, lineWidth, dotRadius }: FlowLinesProps) {
  // Scoped so several diagrams on one page cannot collide.
  const prefix = useId().replace(/[^a-zA-Z0-9-_]/g, "");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      // `overflow: hidden` clips anything drawn outside the diagram's own
      // box — including travelling dots that momentarily sit at SVG (0,0)
      // before their `offset-path` positions them along a curve. Without the
      // clip, those dots leak into whatever sits above the diagram (the
      // dashboard header, another card) and read as stray coloured bubbles.
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
      aria-hidden="true"
    >
      {edges.map((edge) => (
        <path
          key={edge.id}
          d={edge.path}
          data-flow={edge.id}
          data-active={edge.isActive}
          fill="none"
          stroke={edge.color}
          strokeWidth={lineWidth}
          strokeLinecap="round"
          // Joins matter on the cubic's ends where two segments meet at the
          // node outline; round keeps them from spiking at tight angles.
          strokeLinejoin="round"
        />
      ))}

      {dotRadius > 0 &&
        edges.flatMap((edge) =>
          edge.dots.map((dot) => (
            <FlowDot
              key={`${prefix}:${edge.id}:${dot.phaseKey}`}
              path={edge.path}
              durationMs={dot.durationMs}
              reversed={dot.reversed}
              color={dot.color}
              radius={dotRadius}
              phaseKey={dot.phaseKey}
            />
          )),
        )}
    </svg>
  );
}
