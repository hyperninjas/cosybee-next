import AppStoreBadge from "./AppStoreBadge";

/**
 * "Download on the App Store" badge wrapped in an external link. The
 * badge color is driven by the `color` prop on AppStoreBadge — defaults
 * to `currentColor`, so you can also restyle via a Tailwind `text-*`
 * class on the wrapper.
 *
 * Until the app ships, `href` is `null` (see app/lib/app-links.ts) and the
 * badge renders inert — visible but not a dead link.
 */
export default function AppStoreButton({
  href = null,
  className = "",
  color,
}: {
  /** App Store listing URL. `null`/missing → inert "coming soon" badge. */
  href?: string | null;
  className?: string;
  /** Override the badge color. Defaults to `currentColor` (inherits
   *  from the surrounding text color). */
  color?: string;
}) {
  const badge = (
    <AppStoreBadge color={color} className="h-12 lg:h-[58.66px] w-auto" />
  );

  if (!href) {
    return (
      <span
        aria-label="Download on the App Store — coming soon"
        className={`inline-block cursor-default text-muted opacity-90 ${className}`}
      >
        {badge}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download on the App Store"
      className={`inline-block text-muted transition-opacity hover:opacity-90 ${className}`}
    >
      {badge}
    </a>
  );
}
