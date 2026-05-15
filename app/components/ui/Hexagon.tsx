import { type ReactNode } from "react";
import { buildHexMaskDataUri, hexMaskStyle } from "@/app/lib/hex";

const HEX_MASK = buildHexMaskDataUri(100, 86.6, [{ x: 0, y: 0, scale: 1 }]);

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
  // If the caller didn't supply a positioning class, default to `relative`
  // so the inner mask layer (absolute inset-0) can anchor itself. Tailwind
  // orders `relative` after `absolute` in its stylesheet, so prepending
  // `relative` unconditionally would clobber a caller's `absolute`.
  const callerPositions = /\b(absolute|fixed|sticky|relative)\b/.test(className);
  const wrapperClass = callerPositions ? className : `relative ${className}`;

  return (
    <div className={wrapperClass} style={{ aspectRatio: "1.1547 / 1" }}>
      <div
        aria-hidden
        className="absolute inset-0"
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
