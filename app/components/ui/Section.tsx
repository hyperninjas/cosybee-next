import { tv, type VariantProps } from "@heroui/styles";

/**
 * Section — the single source of truth for vertical rhythm and section
 * backgrounds. Replaces the ad-hoc `relative overflow-hidden … py-20 lg:py-25`
 * pattern repeated on every marketing `<section>`.
 *
 * Server component. Pair with {@link Container} for the inner content:
 *
 *   <Section spacing="lg" surface="secondary">
 *     <Container className="grid …">…</Container>
 *   </Section>
 *
 * Custom backgrounds (gradients, brand colours, `text-*`) still go through
 * `className` — `surface` only covers the semantic token backgrounds.
 */
export const sectionVariants = tv({
  base: "relative",
  variants: {
    /** Vertical padding scale. */
    spacing: {
      none: "",
      sm: "py-12 lg:py-16",
      md: "py-16 lg:py-20",
      lg: "py-20 lg:py-25",
    },
    /**
     * Overflow handling. Defaults to `hidden` because most marketing bands
     * clip decorative shapes (hexagons) that bleed past the edge. Set
     * `overflow="visible"` when content is meant to spill out (e.g. a tall
     * mockup anchored to a card's bottom edge).
     */
    overflow: {
      hidden: "overflow-hidden",
      visible: "overflow-visible",
      clip: "overflow-clip",
    },
    /** Semantic background tokens (theme-aware). */
    surface: {
      none: "",
      base: "bg-background",
      surface: "bg-surface",
      secondary: "bg-surface-secondary",
      tertiary: "bg-surface-tertiary",
      dark: "bg-black text-white",
    },
  },
  defaultVariants: {
    spacing: "md",
    surface: "none",
    overflow: "hidden",
  },
});

export type SectionVariants = VariantProps<typeof sectionVariants>;

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    SectionVariants {}

export function Section({
  spacing,
  surface,
  overflow,
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={sectionVariants({ spacing, surface, overflow, className })}
      {...props}
    />
  );
}
