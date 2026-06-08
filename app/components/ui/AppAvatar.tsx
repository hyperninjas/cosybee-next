import { Avatar } from "@heroui/react";
import { AppImage } from "./AppImage";

/**
 * AppAvatar — HeroUI `<Avatar>` whose image is our Next-optimized `AppImage`.
 *
 * HeroUI's `Avatar` is Radix-based, so we slot `AppImage` in via `asChild`:
 * HeroUI keeps the shell (sizes, colours, variants) and the initials fallback
 * lifecycle, while `next/image` (through `AppImage`) provides optimization +
 * a fade-in. No manual overlay needed.
 */
const PX = { sm: 32, md: 40, lg: 48 } as const;

export interface AppAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  color?: "default" | "accent" | "success" | "warning" | "danger";
  variant?: "default" | "soft";
  className?: string;
}

function initials(name?: string | null) {
  const s = (name ?? "").trim();
  if (!s) return "?";
  const p = s.split(/\s+/).filter(Boolean);
  return (
    p.length > 1 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)
  ).toUpperCase();
}

export function AppAvatar({
  src,
  alt,
  name,
  size = "md",
  color,
  variant,
  className = "",
}: AppAvatarProps) {
  return (
    <Avatar
      size={size}
      color={color}
      variant={variant}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Initials show underneath; the optimized photo overlays them when set.
          We overlay rather than `Avatar.Image asChild` because Radix's Slot
          requires a single plain child and next/image doesn't slot into it —
          that's the `React.Children.only` error. */}
      <Avatar.Fallback>{initials(name)}</Avatar.Fallback>
      {src ? (
        <AppImage
          src={src}
          alt={alt ?? name ?? "Avatar"}
          width={PX[size]}
          height={PX[size]}
          fit="cover"
          animation="fade"
          // Mirror HeroUI's own `.avatar__image` (absolute inset-0 size-full)
          // so the photo exactly fills + is clipped to the avatar box.
          className="absolute inset-0 z-10 size-full"
        />
      ) : null}
    </Avatar>
  );
}
