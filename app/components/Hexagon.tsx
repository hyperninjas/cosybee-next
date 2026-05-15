import { type ReactNode } from "react";

// Flat-top hexagon with softly rounded corners. The path is rendered as an
// SVG mask so the element keeps its background but the visible area is the
// hex shape. Aspect ratio is fixed at 2 : √3 (≈ 1.1547 : 1) so height is
// derived from width — callers only need to set width.
const HEX_PATH =
  "M33,0 L67,0 Q75,0 79,6.93 L96,36.37 Q100,43.3 96,50.23 L79,79.67 Q75,86.6 67,86.6 L33,86.6 Q25,86.6 21,79.67 L4,50.23 Q0,43.3 4,36.37 L21,6.93 Q25,0 33,0 Z";

const HEX_MASK = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 86.6' preserveAspectRatio='none'><path d='${HEX_PATH}' fill='black'/></svg>`,
)}")`;

type HexagonProps = {
  /**
   * Tailwind classes for size & position. Use responsive width utilities and
   * the height will follow the hex aspect ratio automatically.
   * Example: "w-[140px] sm:w-[180px] lg:w-[220px] absolute left-4 top-10"
   */
  className?: string;
  /** Image URL rendered as the hex fill. */
  src?: string;
  /** Solid background color. Used alongside `src` as a fallback while it loads. */
  color?: string;
  /** Optional overlay content (not clipped by the mask), positioned inside. */
  children?: ReactNode;
};

export default function Hexagon({
  className = "",
  src,
  color,
  children,
}: HexagonProps) {
  // The inner mask layer uses `absolute inset-0`, so the wrapper must be a
  // positioning context. If the caller already supplied one (absolute / fixed
  // / sticky / relative), don't force `relative` on top — Tailwind orders
  // `relative` after `absolute` in its stylesheet, so a forced `relative`
  // would override the caller's `absolute` and break cluster layouts.
  const callerPositions = /\b(absolute|fixed|sticky|relative)\b/.test(className);
  const wrapperClass = callerPositions ? className : `relative ${className}`;

  return (
    <div className={wrapperClass} style={{ aspectRatio: "1.1547 / 1" }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          WebkitMaskImage: HEX_MASK,
          maskImage: HEX_MASK,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          backgroundColor: color,
          backgroundImage: src ? `url('${src}')` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {children}
    </div>
  );
}
