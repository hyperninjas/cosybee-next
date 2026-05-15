import Image, { type StaticImageData } from "next/image";
import { type ReactNode } from "react";
import { HEX_PATH } from "@/app/lib/hex";
import hexaCheck from "@/public/hexa-check.svg";
import hexaSun from "@/public/hexa-sun.svg";
import hexaDollar from "@/public/hexa-dollar.svg";
import hexaChart from "@/public/hexa-chart.svg";

const GLYPH_SVGS: Record<GlyphName, StaticImageData> = {
  check: hexaCheck,
  sun: hexaSun,
  dollar: hexaDollar,
  chart: hexaChart,
};

/** Names of the glyph drawn inside a yellow hex badge. */
export type GlyphName = "check" | "sun" | "dollar" | "chart";

const GLYPHS: Record<GlyphName, ReactNode> = {
  check: (
    <path
      d="M30 44 L43 57 L70 30"
      stroke="white"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  sun: (
    <g
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      transform="translate(50 43.3)"
    >
      <circle r="9" />
      <line x1="0" y1="-18" x2="0" y2="-14" />
      <line x1="0" y1="14" x2="0" y2="18" />
      <line x1="-18" y1="0" x2="-14" y2="0" />
      <line x1="14" y1="0" x2="18" y2="0" />
      <line x1="-13" y1="-13" x2="-10" y2="-10" />
      <line x1="10" y1="-13" x2="13" y2="-10" />
      <line x1="-13" y1="13" x2="-10" y2="10" />
      <line x1="10" y1="13" x2="13" y2="10" />
    </g>
  ),
  dollar: (
    <text
      x="50"
      y="60"
      textAnchor="middle"
      fill="white"
      fontSize="42"
      fontWeight="700"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      $
    </text>
  ),
  chart: (
    <g
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x="30" y="26" width="40" height="36" rx="3" />
      <line x1="40" y1="55" x2="40" y2="48" />
      <line x1="50" y1="55" x2="50" y2="44" />
      <line x1="60" y1="55" x2="60" y2="40" />
      <polyline points="38 40 50 34 62 36" />
    </g>
  ),
};

/**
 * Yellow hex badge with a white glyph inside. Sized via Tailwind classes on
 * the SVG element — width/height utilities both work because the SVG keeps
 * its own viewBox aspect ratio.
 */
export function HexBadge({
  glyph,
  color = "#EDC535",
  className = "",
}: {
  glyph: GlyphName;
  /** Hex fill color. Defaults to the cosybee yellow. */
  color?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 86.6" className={`shrink-0 ${className}`} aria-hidden>
      <path d={HEX_PATH} fill={color} />
      {GLYPHS[glyph]}
    </svg>
  );
}

/**
 * Centered section header — big title + optional muted description.
 * Drop above any block of cards or features.
 */
export function SectionHeader({
  title,
  description,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-3xl text-center ${className}`}>
      <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-black sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Card with a media slot (image, phone mockup, anything) on top, then
 * title + description + optional bullet list. Pass any ReactNode as `media`.
 */
export function MediaCard({
  media,
  title,
  description,
  bullets,
  mediaBg = "#EEF6FF",
}: {
  media?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  bullets?: string[];
  /** Background tint for the media area. */
  mediaBg?: string;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.06)]">
      {media && (
        <div
          className="flex items-end justify-center px-6 pt-6"
          style={{ backgroundColor: mediaBg }}
        >
          {media}
        </div>
      )}
      <div className="p-6 sm:p-7">
        <h3 className="text-2xl font-bold leading-tight text-black sm:text-[28px]">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
          {description}
        </p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-5 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <HexBadge glyph="check" className="h-5 w-6 lg:h-6 lg:w-7" />
                <span className="text-sm text-black sm:text-base">{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/** Large bold section heading (e.g. "Why Choose energiebee Solar?"). */
export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-3xl font-extrabold leading-tight tracking-tight text-black sm:text-4xl lg:text-[40px] ${className}`}
    >
      {children}
    </h2>
  );
}

/** Muted intro paragraph that sits below a SectionTitle. */
export function SectionLead({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mt-4 max-w-xl text-base leading-relaxed text-[#545454] sm:text-base ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * Plain feature row (no card background) — yellow hex check badge + title +
 * description. Uses the static /public/hexa-check.svg.
 */
export function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <Image
        src={hexaCheck}
        alt=""
        aria-hidden
        // className="mt-1 h-6 w-7 lg:h-10 lg:w-8.5"
        className="mt-1.5"
      />
      <div>
        <h3 className="text-base font-bold text-[#1F1F1F] sm:text-lg">
          {title}
        </h3>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#545454] sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * White card with shadow — hex badge + title + description. The card itself
 * is full-width; wrap or grid as needed at the call site.
 */
export function FeatureCard({
  glyph,
  title,
  description,
}: {
  glyph: GlyphName;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
      <Image
        src={GLYPH_SVGS[glyph]}
        alt=""
        aria-hidden
        className="h-11 w-12 lg:h-10 lg:w-11 mt-2.5"
      />
      <div>
        <h3 className="text-lg font-bold text-black sm:text-lg">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#545454]">
          {description}
        </p>
      </div>
    </div>
  );
}
