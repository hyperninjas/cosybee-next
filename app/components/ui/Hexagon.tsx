import { type ReactNode } from "react";
import { buildHexMaskDataUri, hexMaskStyle } from "@/app/lib/hex";

const HEX_MASK = buildHexMaskDataUri(100, 86.6, [{ x: 0, y: 0, scale: 1 }]);

type HexagonProps = {
  /**
   * Tailwind classes for size & position. Use responsive width utilities and
   * the height will follow the hex aspect ratio automatically. Pass an
   * `h-*` utility to override the aspect ratio and stretch the hex shape.
   * Example: "w-[140px] sm:w-[180px] lg:w-[220px] absolute left-4 top-10"
   */
  className?: string;
  hexagonClassName?: string;
  /** Image URL rendered as the hex fill. */
  src?: string;
  /** Solid background color. Used alongside `src` as a fallback while it loads. */
  color?: string;
  /** Optional overlay content (not clipped by the mask), positioned inside. */
  children?: ReactNode;
};

export default function Hexagon({
  className = "",
  hexagonClassName = "",
  src,
  color,
  children,
}: HexagonProps) {
  // If the caller didn't supply a positioning class, default to `relative`
  // so the inner mask layer (absolute inset-0) can anchor itself. Tailwind
  // orders `relative` after `absolute` in its stylesheet, so prepending
  // `relative` unconditionally would clobber a caller's `absolute`.
  const callerPositions = /\b(absolute|fixed|sticky|relative)\b/.test(
    className,
  );
  const wrapperClass = callerPositions ? className : `relative ${className}`;

  // Default to the natural hex aspect ratio so callers only need to set a
  // width. If the caller passes an `h-*` utility, skip aspect-ratio so the
  // explicit height wins and the hex stretches to fit.
  const callerSetsHeight = /(?:^|[\s:])h-/.test(className);
  const wrapperStyle = callerSetsHeight
    ? undefined
    : { aspectRatio: "1.16 / 1" };

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <div
        aria-hidden
        className={`absolute inset-0 ${hexagonClassName}`}
        style={{
          ...hexMaskStyle(HEX_MASK),
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
