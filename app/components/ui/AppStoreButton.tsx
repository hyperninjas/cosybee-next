import AppStoreBadge from "./AppStoreBadge";

/**
 * "Download on the App Store" badge wrapped in an external link. The
 * badge color is driven by the `color` prop on AppStoreBadge — defaults
 * to `currentColor`, so you can also restyle via a Tailwind `text-*`
 * class on the wrapper.
 */
export default function AppStoreButton({
  href = "#",
  className = "",
  color,
}: {
  /** App Store URL. Defaults to the generic apps.apple.com landing. */
  href?: string;
  className?: string;
  /** Override the badge color. Defaults to `currentColor` (inherits
   *  from the surrounding text color). */
  color?: string;
}) {
  return (
    <a
      href={href}
      // target="_blank"
      rel="noopener noreferrer"
      aria-label="Download on the App Store"
      className={`inline-block text-[#CCCCCC] transition-opacity hover:opacity-90 ${className}`}
    >
      <AppStoreBadge color={color} className="h-12 lg:h-[58.66px] w-auto" />
    </a>
  );
}
