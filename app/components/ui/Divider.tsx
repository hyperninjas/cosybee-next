/**
 * Thin horizontal rule used between page sections. Renders a single
 * 1px line in the project's neutral border color; override with the
 * `className` prop when you need extra margin, a different color,
 * etc. Use `<Divider vertical />` for a vertical separator.
 */
export default function Divider({
  vertical = false,
  className = "",
}: {
  /** Render a vertical line instead of a horizontal one. */
  vertical?: boolean;
  className?: string;
}) {
  const base = vertical
    ? "h-full w-px border-l border-[#E9E8E8]"
    : "w-full border-b border-[#E9E8E8]";
  return <div role="separator" className={`${base} ${className}`} />;
}
