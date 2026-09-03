"use client";
"use no memo";

import type { CSSProperties, ReactNode } from "react";
import { ringIsEmpty, type HomeRingShares } from "../model/solution";
import { clampFinite, nonNegative, pathIsFinite, positive } from "../model/finite";
import { rect as makeRect } from "../model/types";
import { deflateRect } from "../render/nodeShape";
import type { EnergyFlowStyle } from "../render/style";

/** One line of text inside a node, optionally prefixed by a small arrow. */
export interface EnergyNodeLine {
  readonly text: string;
  /** Small leading icon, typically a direction arrow. */
  readonly icon?: ReactNode;
  /** Colour override for both the icon and the text. */
  readonly color?: string;
}

export interface EnergyNodeViewProps {
  readonly style: EnergyFlowStyle;
  /** Colour of the plain border. Pass a transparent colour to hide it. */
  readonly borderColor: string;
  /** Rendered inside the node. */
  readonly icon?: ReactNode;
  /** Readings rendered under the icon. */
  readonly lines: readonly EnergyNodeLine[];
  /**
   * Readings rendered ABOVE the icon, styled identically to `lines`. Use
   * when a node has two same-weight readings that read better as
   * "top-of-icon / bottom-of-icon" than stacked underneath (e.g. the Grid
   * node's export and import values).
   */
  readonly linesAbove?: readonly EnergyNodeLine[];
  /** Small line above the icon. */
  readonly secondary?: string;
  /** When set, draws the segmented ring instead of a plain border. */
  readonly ringShares?: HomeRingShares;
  /** Tap handler. The node is not focusable when absent. */
  readonly onTap?: () => void;
  /** Accessible name, used when `onTap` makes this a button. */
  readonly ariaLabel?: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Renders a single node: its outline, its icon and its readings.
 *
 * The outline comes from `style.shape`, so this component is identical for
 * circular and hexagonal diagrams. When `ringShares` is supplied the plain
 * border is replaced by the segmented consumption ring.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * HOW THE RING IS DRAWN
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The Flutter package slices the outline with `PathMetric` because Flutter has
 * no dash support that follows an arbitrary path. SVG does: `pathLength="1"`
 * renormalises the path so every dash length is a FRACTION of the perimeter,
 * and `stroke-dasharray` / `stroke-dashoffset` then place each segment exactly
 * where `OutlineSlicer.slice` would have cut it — for a circle, a hexagon or
 * any other shape, with no special casing.
 *
 * That is also what the original reference card does, per the Dart docstring:
 * this port gets back to the mechanism the Flutter version had to emulate.
 */
export function EnergyNodeView({
  style,
  borderColor,
  icon,
  lines,
  linesAbove,
  secondary,
  ringShares,
  onTap,
  ariaLabel,
  width: rawWidth,
  height: rawHeight,
}: EnergyNodeViewProps) {
  // 🔴 A node with a zero, negative or unusable size produces an outline whose
  // every coordinate is NaN, and an SVG path holding NaN renders as nothing at
  // all — so the node would disappear silently rather than look wrong.
  const width = positive(rawWidth, 0);
  const height = positive(rawHeight, 0);
  if (width <= 0 || height <= 0) return null;

  const box = makeRect(0, 0, width, height);

  const valueStyle: CSSProperties = {
    fontSize: 12,
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    ...style.valueStyle,
  };
  const secondaryStyle: CSSProperties = {
    fontSize: 10,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    ...style.secondaryStyle,
  };

  const hasRing = ringShares !== undefined && !ringIsEmpty(ringShares);

  // Strokes are clamped to what actually fits: half the shortest side. A ring
  // wider than the node inverts its own outline through the centre, which draws
  // a knot rather than a ring.
  const maxStroke = Math.min(width, height) / 2;
  const borderWidth = Math.min(nonNegative(style.borderWidth, 2), maxStroke);
  const ringWidth = Math.min(nonNegative(style.ringWidth, 4), maxStroke);
  const ringStart = clampFinite(style.ringStartFraction, 0, 1, 0);

  // Inset by half the stroke so the outline sits fully inside the node's box —
  // the same `deflate` the Dart painter applies.
  const borderPath = style.shape.buildPath(deflateRect(box, borderWidth / 2));
  const ringPath = style.shape.buildPath(deflateRect(box, ringWidth / 2));
  const fillPath = style.shape.buildPath(box);

  const segments: { color: string; fraction: number; start: number }[] = [];
  if (hasRing) {
    let cursor = ringStart;
    const push = (fraction: number, color: string): void => {
      // A non-finite or non-positive share draws nothing. Without the finite
      // check a NaN share becomes `stroke-dasharray="NaN NaN"`, which drops the
      // whole segment and silently changes what the ring appears to say.
      if (!Number.isFinite(fraction) || fraction <= 0) return;
      const clamped = Math.min(fraction, 1);
      segments.push({ color, fraction: clamped, start: cursor });
      cursor += clamped;
    };
    // Same order the Dart painter lays them down in.
    push(ringShares.grid, style.palette.gridImport);
    push(ringShares.lowCarbon, style.palette.lowCarbon);
    push(ringShares.battery, style.palette.batteryOut);
    push(ringShares.solar, style.palette.solar);
  }

  const interactive = onTap !== undefined;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        cursor: interactive ? "pointer" : undefined,
      }}
      {...(interactive
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-label": ariaLabel,
            onClick: onTap,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTap?.();
              }
            },
          }
        : {})}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden="true"
      >
        {style.nodeBackgroundColor !== undefined && pathIsFinite(fillPath) && (
          <path d={fillPath} fill={style.nodeBackgroundColor} />
        )}
        {!hasRing && borderWidth > 0 && pathIsFinite(borderPath) && (
          <path
            d={borderPath}
            fill="none"
            stroke={borderColor}
            strokeWidth={borderWidth}
            strokeLinejoin="round"
          />
        )}
        {hasRing &&
          pathIsFinite(ringPath) &&
          segments.map((s) => (
            <path
              key={`${s.color}:${s.start}`}
              d={ringPath}
              pathLength={1}
              fill="none"
              stroke={s.color}
              strokeWidth={ringWidth}
              // Round joins stop polygon corners spiking; butt caps keep
              // adjacent segments from overlapping each other.
              strokeLinejoin="round"
              strokeLinecap="butt"
              strokeDasharray={`${s.fraction} ${Math.max(0, 1 - s.fraction)}`}
              strokeDashoffset={-s.start}
            />
          ))}
      </svg>

      <div
        style={{
          position: "absolute",
          // Never larger than the box, or the content area inverts and the
          // readings vanish inside a node that still draws its outline.
          inset: Math.min(ringWidth + 4, Math.min(width, height) / 2),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          // The Dart version wraps its column in a `FittedBox(scaleDown)`.
          // Clipping plus nowrap children is the CSS equivalent that keeps a
          // long reading from pushing the outline out of shape.
          overflow: "hidden",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        {secondary !== undefined && <div style={secondaryStyle}>{secondary}</div>}
        {linesAbove?.map((line, i) => (
          <div
            key={`above:${line.text}:${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              ...valueStyle,
              ...(line.color === undefined ? {} : { color: line.color }),
            }}
          >
            {line.icon}
            <span>{line.text}</span>
          </div>
        ))}
        {icon}
        {lines.map((line, i) => (
          <div
            key={`${line.text}:${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              ...valueStyle,
              ...(line.color === undefined ? {} : { color: line.color }),
            }}
          >
            {line.icon}
            <span>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
