"use client";

import NextImage, { type ImageProps } from "next/image";
import { tv, type VariantProps } from "@heroui/styles";
import { forwardRef, useState } from "react";

/**
 * AppImage — our reusable Image **primitive**.
 *
 * HeroUI v3 has no Image component, so this is our own, built the HeroUI way
 * (`tv` from `@heroui/styles`). It renders a single `next/image` element (so it
 * also works as a Radix `asChild` slot — e.g. inside HeroUI `Avatar.Image`),
 * keeping full Next optimization (AVIF/WebP, `fill`, `sizes`, `priority`, lazy,
 * responsive). Variants cover the scenarios a site needs:
 *   - `fit`: cover / contain / fill / none / scaleDown (full-width, hero, bg)
 *   - `radius`: none … full (avatars, cards)
 *   - `animation`: none / fade / zoom / blur (reveal on load, or off)
 *
 * All `next/image` props pass through. Use `fill` (with a sized, relative
 * parent) for backgrounds/covers, or `width`+`height` for fixed images.
 */
export const imageVariants = tv({
  base: "max-w-full",
  variants: {
    fit: {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      none: "object-none",
      scaleDown: "object-scale-down",
    },
    radius: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      full: "rounded-full",
    },
    animation: {
      none: "",
      fade: "opacity-0 transition-opacity duration-500 ease-out data-[loaded=true]:opacity-100",
      zoom: "scale-105 opacity-0 transition-all duration-500 ease-out data-[loaded=true]:scale-100 data-[loaded=true]:opacity-100",
      blur: "blur-md opacity-0 transition-[opacity,filter] duration-500 ease-out data-[loaded=true]:blur-0 data-[loaded=true]:opacity-100",
    },
  },
  defaultVariants: {
    fit: "cover",
    radius: "none",
    animation: "none",
  },
});

export type ImageVariants = VariantProps<typeof imageVariants>;

export interface AppImageProps extends Omit<ImageProps, "src">, ImageVariants {
  /** Optional so `src` can also arrive via Radix `asChild` (e.g. Avatar.Image). */
  src?: ImageProps["src"];
}

export const AppImage = forwardRef<HTMLImageElement, AppImageProps>(
  function AppImage(
    {
      fit,
      radius,
      animation,
      className,
      title = "",
      onLoad,
      alt = "",
      ...props
    },
    ref,
  ) {
    // Nothing to reveal when there's no animation → start "loaded".
    const animated = Boolean(animation) && animation !== "none";
    const [loaded, setLoaded] = useState(!animated);

    return (
      <NextImage
        ref={ref}
        {...(props as ImageProps)}
        alt={alt}
        title={title}
        data-loaded={loaded}
        className={imageVariants({ fit, radius, animation, className })}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
      />
    );
  },
);
