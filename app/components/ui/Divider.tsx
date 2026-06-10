import { Separator } from "@heroui/react";

/**
 * Thin separator line used between page sections. Thin wrapper over HeroUI's
 * `Separator` (theme-aware, accessible `role="separator"`), keeping the
 * project's `vertical` shorthand. Pass `className` for extra margin etc.
 */
export default function Divider({
  vertical = false,
  className = "",
}: {
  /** Render a vertical line instead of a horizontal one. */
  vertical?: boolean;
  className?: string;
}) {
  return (
    <Separator
      orientation={vertical ? "vertical" : "horizontal"}
      className={className}
    />
  );
}
