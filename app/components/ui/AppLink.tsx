import NextLink from "next/link";
import { Link as HeroLink } from "@heroui/react";
import { linkVariants } from "@heroui/styles";
import type { ComponentProps, ReactNode } from "react";

/**
 * AppLink — Next.js `<Link>` styled with HeroUI, the HeroUI-documented way.
 *
 * Keeps ALL of Next's routing (client nav, prefetch, `replace`, `scroll`,
 * object hrefs) and applies HeroUI's link styling via `linkVariants()`.
 *
 * `variant`:
 *   - `"plain"` (default) → unstyled; a drop-in `<Link>` for nav items, logos,
 *     and card wrappers (which should NOT look like inline links).
 *   - `"link"` → HeroUI inline-link look (accent, hover underline); pair with
 *     `withIcon` to append HeroUI's `Link.Icon`.
 */
export interface AppLinkProps extends ComponentProps<typeof NextLink> {
  variant?: "plain" | "link";
  external?: boolean;
  withIcon?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AppLink({
  variant = "plain",
  external = false,
  withIcon = false,
  className = "",
  children,
  ...props
}: AppLinkProps) {
  const slots = linkVariants();
  const styled = variant === "link" ? slots.base() : "";
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <NextLink
      className={`${styled} ${className}`.trim()}
      {...externalProps}
      {...props}
    >
      {children}
      {withIcon && variant === "link" ? (
        <HeroLink.Icon className={slots.icon()} />
      ) : null}
    </NextLink>
  );
}
