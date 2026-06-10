import { tv, type VariantProps } from "@heroui/styles";
import { type ImageProps } from "next/image";

/**
 * Shared style variants + prop types for {@link AppImage} and its animated
 * client counterpart. Lives in its own (pure, no-"use client") module so both
 * the server dispatcher and the client reveal component can import it without
 * creating a client boundary or an import cycle.
 *
 *   - `fit`: cover / contain / fill / none / scaleDown (full-width, hero, bg)
 *   - `radius`: none … full (avatars, cards)
 *   - `animation`: none / fade / zoom / blur (reveal on load, or off)
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
