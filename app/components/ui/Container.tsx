import { tv, type VariantProps } from "@heroui/styles";

/**
 * Container — the single source of truth for horizontal layout: centering,
 * max-width, and responsive gutters. Replaces the `mx-auto max-w-360 px-6
 * sm:px-10 lg:px-30` string that was copy-pasted across 75+ call sites.
 *
 * Server component (no client JS). Add grid/flex/gap utilities via `className`;
 * the primitive only owns centering + width + padding.
 *
 *   <Container className="grid grid-cols-1 items-center gap-12 ...">…</Container>
 */
export const containerVariants = tv({
  // `relative` so absolutely-positioned decorations inside a section anchor here.
  base: "relative mx-auto w-full",
  variants: {
    size: {
      /** Site-wide standard marketing width (90rem). */
      page: "max-w-360 px-6 sm:px-10 lg:px-30",
      /** Long-form reading width (article bodies). */
      prose: "max-w-225 px-6 sm:px-8",
      /** Narrow column (legal, FAQ, simple forms). */
      narrow: "max-w-3xl px-6",
      /** Wide content grids that aren't full marketing width. */
      wide: "max-w-7xl px-6 sm:px-10",
    },
  },
  defaultVariants: {
    size: "page",
  },
});

export type ContainerVariants = VariantProps<typeof containerVariants>;

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    ContainerVariants {}

export function Container({ size, className, ...props }: ContainerProps) {
  return <div className={containerVariants({ size, className })} {...props} />;
}
