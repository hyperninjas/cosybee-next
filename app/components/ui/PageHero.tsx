import { type ReactNode } from "react";
import { type StaticImageData } from "next/image";
import HeroBackground from "@/app/components/ui/HeroBackground";
import { Section } from "@/app/components/ui/Section";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";

type Crumb = { name: string; path: string };

type Props = {
  /** Full-bleed background cover. Static import so the blur placeholder works. */
  bgImage: StaticImageData;
  /** Optional portrait/mobile crop shown below the `sm` breakpoint. When given,
   *  `bgImage` is shown from `sm` up. next/image still serves viewport-sized
   *  derivatives, so this is art direction (composition), not a size hack. */
  bgImageMobile?: StaticImageData;
  /** Decorative by default (empty alt); pass a value only when meaningful. */
  imageAlt?: string;
  /** Optional dark-tone breadcrumb trail rendered above the content. */
  crumbs?: Crumb[];
  /** The hero copy — heading, lead text, and any CTA. */
  children: ReactNode;
  minHeight?: string;
};

/**
 * Shared dark page hero — full-bleed cover photo under a top-down gradient,
 * with a centred max-width content column. The chrome (background, gradient,
 * spacing) is identical across the marketing, contact, and blog heroes; each
 * caller supplies its own `bgImage`, optional `crumbs`, and copy as children.
 *
 * HomeHero is intentionally not built on this — it has a distinct layout.
 */
export default function PageHero({
  bgImage,
  bgImageMobile,
  imageAlt = "",
  minHeight = "min-h-[50vh] md:min-h-[73vh]",
  crumbs,
  children,
}: Props) {
  return (
    <Section
      surface="dark"
      spacing="none"
      className={`isolate flex flex-col justify-center ${minHeight}`}
    >
      {/* background photo + gradient */}
      <HeroBackground
        image={bgImage}
        imageMobile={bgImageMobile}
        alt={imageAlt}
      />

      <div className="relative mx-auto w-full max-w-360 items-center pt-16 pb-24 px-6 lg:px-30 lg:pt-15 lg:pb-11">
        <div className="relative z-10">
          {crumbs && crumbs.length > 0 && (
            <Breadcrumbs items={crumbs} tone="dark" className="mb-5" />
          )}
          {children}
        </div>
      </div>
    </Section>
  );
}
