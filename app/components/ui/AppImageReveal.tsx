"use client";

import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";
import { imageVariants, type AppImageProps } from "./image-variants";

/**
 * Client-only reveal variant of {@link AppImage}. Tracks load state so the
 * image can fade/zoom/blur in. Only mounted when an `animation` is actually
 * requested — the default (static) path stays a server component with zero
 * client JS. Do not import this directly; use `AppImage`.
 */
export function AppImageReveal({
  fit,
  radius,
  animation,
  className,
  title = "",
  alt = "",
  onLoad,
  ...props
}: AppImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <NextImage
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
}
