"use client";
"use no memo";

import { useEffect, useId, useRef } from "react";
import type { FlowEdge } from "../render/flowRoute";

export interface FlowLinesProps {
  readonly edges: readonly FlowEdge[];
  readonly width: number;
  readonly height: number;
  readonly lineWidth: number;
  readonly dotRadius: number;
}

/**
 * The nominal cycle every dot animation is created with.
 *
 * Speed is then applied as `playbackRate`, never by changing the duration — see
 * `FlowDot` below for why that distinction is the whole point.
 */
const BASE_DURATION_MS = 2000;

/** Whether the viewer has asked for less motion. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
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
 * One travelling dot.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 SPEED IS A PLAYBACK RATE, NOT A DURATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The first version of this used SVG `<animateMotion dur={...}>` and claimed
 * that changing `dur` rescaled the animation in place. That is not what
 * browsers do: mutating a running SMIL animation's `dur` RESTARTS it, so every
 * dot snapped back to the start of its line each time a reading changed. On a
 * live feed that is a visible twitch every few minutes; with a slider in hand it
 * is constant, and it makes the diagram look broken.
 *
 * The Flutter package avoids the same problem by hand — it keeps a phase per dot
 * across rebuilds and advances it from a `Ticker` — at the cost of a repaint
 * every frame.
 *
 * The Web Animations API gives it properly. The animation is created ONCE with a
 * fixed `BASE_DURATION_MS`, and speed is applied as `playbackRate`, which is
 * defined to change the rate without touching `currentTime`. So a dot keeps
 * exactly the position it had, changes speed smoothly, and React never
 * re-renders for it.
 *
 * `offsetPath` likewise updates in place, so a re-layout moves the dot onto the
 * new curve at the same fractional distance instead of teleporting it home.
 */
function FlowDot({ path, durationMs, reversed, color, radius, phaseKey }: DotProps) {
  const ref = useRef<SVGCircleElement>(null);
  const animation = useRef<Animation | null>(null);

  // Create once per element. Deliberately no dependency on duration or path:
  // both are applied to the LIVE animation below, which is what preserves phase.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    if (prefersReducedMotion()) return;

    const anim = el.animate(
      [{ offsetDistance: "0%" }, { offsetDistance: "100%" }],
      {
        duration: BASE_DURATION_MS,
        iterations: Number.POSITIVE_INFINITY,
        easing: "linear",
      },
    );
    animation.current = anim;
    return () => {
      anim.cancel();
      animation.current = null;
    };
  }, []);

  // Speed. `playbackRate` is the one control that does not reset `currentTime`.
  useEffect(() => {
    const anim = animation.current;
    if (!anim) return;
    const rate = BASE_DURATION_MS / Math.max(1, durationMs);
    // Direction is a signed rate rather than a `direction` option, so a load
    // that flips to feeding the house reverses from where the dot already is.
    anim.playbackRate = reversed ? -rate : rate;
  }, [durationMs, reversed]);

  return (
    <circle
      ref={ref}
      r={radius}
      fill={color}
      data-dot={phaseKey}
      // `offsetPath` sits on the JSX style so the very first paint already has
      // the dot on its curve — no post-mount effect race, no brief flash at
      // SVG (0,0) leaking into whatever sits above the diagram. Setting it
      // declaratively is safe because React only touches CSS keys that
      // actually changed, so a re-layout that hands us the same path won't
      // restart the animation.
      //
      // `offsetAnchor: "center"` prevents the dot from also orbiting its own
      // centre while it travels — that would read as a wobble on tight curves.
      style={{
        offsetPath: `path("${path}")`,
        offsetRotate: "0deg",
        offsetAnchor: "center",
      }}
    />
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
