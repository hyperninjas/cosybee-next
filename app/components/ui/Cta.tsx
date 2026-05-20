import { type ReactNode } from "react";
import { HexBadge, type InlineGlyphName } from "./SectionContent";

type CtaSize = "md" | "lg";

const SIZE_CLASSES: Record<CtaSize, string> = {
  md: "px-6 py-3.5 text-base sm:text-lg lg:text-[22px] leading-[135%]",
  lg: "px-10 py-4 text-lg sm:px-12 sm:text-xl",
};

/**
 * The orange→red gradient call-to-action button used across the marketing
 * pages. `size="lg"` is the hero variant; `size="md"` is the banner variant.
 */
export function CtaButton({
  href,
  children,
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  size?: CtaSize;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex shrink-0 font-semibold text-[22px] items-center justify-center rounded-lg bg-linear-[93.03deg] from-[#E52D2D] via-[#D25116] to-[#D86813] text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110 ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </a>
  );
}

// Two layered SVG patterns — same hex outline, second offset by half a tile —
// give a true honeycomb instead of a rectangular grid.
const HEX_TILE = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 52'><polygon points='15,0 45,0 60,26 45,52 15,52 0,26' fill='none' stroke='rgba(0,0,0,0.07)' stroke-width='1.2'/></svg>`,
);
const HEX_PATTERN_BG = {
  backgroundImage: `url("data:image/svg+xml;utf8,${HEX_TILE}"), url("data:image/svg+xml;utf8,${HEX_TILE}")`,
  backgroundPosition: "0 0, 30px 26px",
  backgroundSize: "60px 52px, 60px 52px",
  backgroundRepeat: "repeat, repeat",
} as const;

/**
 * Wide light-card banner with a subtle honeycomb background — text on the
 * left, CtaButton on the right. Renders as a `<section>` already wrapped in
 * page-edge padding, so just drop it between sections.
 */
export function CtaBanner({
  title,
  description,
  buttonText,
  href,
}: {
  title: string;
  description: string;
  buttonText: string;
  href: string;
}) {
  return (
    <section className="px-6 py-12 sm:px-10 lg:px-30 lg:py-16">
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-white px-8 py-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] sm:px-12 lg:px-30 lg:py-14"
        style={HEX_PATTERN_BG}
      >
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold leading-tight text-black sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base">
              {description}
            </p>
          </div>
          <CtaButton href={href}>{buttonText}</CtaButton>
        </div>
      </div>
    </section>
  );
}

/**
 * Horizontal CTA card: hex icon (left) + title & description (middle) +
 * CtaButton (right). Stacks vertically below `lg`.
 */
export function CtaCard({
  glyph,
  glyphColor = "#A3D055",
  title,
  description,
  buttonText,
  href,
  className = "",
  titleClassName = "",
  descClassName = "",
  buttonClassName = "",
}: {
  glyph?: InlineGlyphName;
  glyphColor?: string;
  title: ReactNode;
  description: ReactNode;
  buttonText: string;
  href: string;
  className?: string;
  titleClassName?: string;
  descClassName?: string;
  buttonClassName?: string;
}) {
  return (
    <div
      className={`flex flex-col items-start gap-5 rounded-3xl border border-[#DAE7ED] bg-[#FAFBFC] ${!glyph ? "bg-[url(/bg-hive-grid.svg)]" : ""} bg-cover bg-center bg-no-repeat p-6 shadow-[9px_9px_13px_0_rgba(0,0,0,0.04),-11px_-8px_14px_0_rgba(0,0,0,0.03)] sm:p-7 lg:flex-row lg:items-center lg:gap-5 lg:p-12 ${className}`}
    >
      {glyph && (
        <HexBadge
          glyph={glyph}
          color={glyphColor}
          className="h-14 w-16 sm:h-18 sm:w-22"
        />
      )}
      <div className="flex-1">
        <h3
          className={`text-xl  font-extrabold leading-tight text-black sm:text-2xl lg:text-[40px] 
            ${titleClassName}`}
        >
          {title}
        </h3>
        <p
          className={`mt-2 text-sm max-w-188.25 leading-relaxed text-neutral-600 sm:text-base ${descClassName}`}
        >
          {description}
        </p>
      </div>
      <CtaButton
        href={href}
        size="md"
        className={`w-full sm:w-auto ${buttonClassName}`}
      >
        {buttonText}
      </CtaButton>
    </div>
  );
}
