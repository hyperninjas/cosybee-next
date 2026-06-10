import NextImage, { type ImageProps } from "next/image";
import { AppImageReveal } from "./AppImageReveal";
import { imageVariants, type AppImageProps } from "./image-variants";

// Re-export so existing imports of these names from "./AppImage" keep working.
export { imageVariants } from "./image-variants";
export type { ImageVariants, AppImageProps } from "./image-variants";

/**
 * AppImage — our reusable Image **primitive**.
 *
 * HeroUI v3 has no Image component, so this is our own, built the HeroUI way
 * (`tv` from `@heroui/styles`, see ./image-variants). It renders a single
 * `next/image`, keeping full Next optimization (AVIF/WebP, `fill`, `sizes`,
 * `priority`, lazy, responsive).
 *
 * Performance: the default (static) path is a **server component** — no
 * `"use client"`, no state, no hydration. Only when an `animation` is requested
 * do we delegate to the client {@link AppImageReveal}, so a page full of static
 * images ships zero image-related JS. All `next/image` props pass through.
 */
export function AppImage({
  fit,
  radius,
  animation,
  className,
  title = "",
  alt = "",
  ...props
}: AppImageProps) {
  // Animated reveal needs client-side load tracking → mount the client island.
  if (animation && animation !== "none") {
    return (
      <AppImageReveal
        fit={fit}
        radius={radius}
        animation={animation}
        className={className}
        title={title}
        alt={alt}
        {...props}
      />
    );
  }

  // Static path: pure server component, zero client JS.
  return (
    <NextImage
      {...(props as ImageProps)}
      alt={alt}
      title={title}
      className={imageVariants({ fit, radius, animation: "none", className })}
    />
  );
}
