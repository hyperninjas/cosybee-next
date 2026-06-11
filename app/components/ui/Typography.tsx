import { tv, type VariantProps } from "@heroui/styles";

/**
 * Typography primitives — the single source of truth for the brand type scale.
 *
 * Built the HeroUI way (`tv` from `@heroui/styles`, like AppImage/AppLink)
 * rather than HeroUI's native `Typography`, because the marketing scale (75px
 * hero, 40px section titles) is larger than HeroUI's defaults. Variants are
 * **colour-agnostic** so a heading inherits white on a dark hero band and black
 * on a light section — pass colour/tone via `className`/`tone`.
 *
 *   <Heading as="h1" variant="display">…</Heading>
 *   <Text variant="lead" tone="muted">…</Text>
 */
export const headingVariants = tv({
  variants: {
    variant: {
      /** Hero headline (~75px at lg). */
      display:
        "text-4xl font-extrabold leading-[110%] tracking-tight sm:text-4xl md:text-5xl min-[1000px]:text-[60px]! min-[1200px]:text-[75px]!",
      /** Section title (~40px at lg). */
      title:
        "text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[40px]",
      /** Card / sub-section title (~24px). */
      cardTitle: "text-2xl font-extrabold leading-tight sm:text-[24px]",
    },
  },
  defaultVariants: {
    variant: "title",
  },
});

export type HeadingVariants = VariantProps<typeof headingVariants>;

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>, HeadingVariants {
  /** Semantic element to render. Defaults to `h2`. */
  as?: React.ElementType;
}

export function Heading({
  as: Tag = "h2",
  variant,
  className,
  ...props
}: HeadingProps) {
  return <Tag className={headingVariants({ variant, className })} {...props} />;
}

export const textVariants = tv({
  variants: {
    variant: {
      /** Hero sub-headline. */
      heroLead: "text-base leading-7 sm:text-[18px] md:text-[22px]",
      /** Intro paragraph under a section title. */
      lead: "text-base leading-relaxed sm:text-base",
      /** Default body / description copy. */
      body: "text-sm leading-relaxed",
    },
    tone: {
      default: "",
      /** Muted secondary text — theme-aware (light & dark). */
      muted: "text-muted",
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "default",
  },
});

export type TextVariants = VariantProps<typeof textVariants>;

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>, TextVariants {
  /** Semantic element to render. Defaults to `p`. */
  as?: React.ElementType;
}

export function Text({
  as: Tag = "p",
  variant,
  tone,
  className,
  ...props
}: TextProps) {
  return (
    <Tag className={textVariants({ variant, tone, className })} {...props} />
  );
}
