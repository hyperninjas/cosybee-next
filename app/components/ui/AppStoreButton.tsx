import AppStoreBadge from "./AppStoreBadge";

/**
 * "Download on the App Store" badge wrapped in an external link. The
 * badge color is driven by the `color` prop on AppStoreBadge — defaults
 * to `currentColor`, so you can also restyle via a Tailwind `text-*`
 * class on the wrapper.
 *
 * Takes the bare numeric App Store ID (see app/lib/app-links.ts) and builds
 * the https listing URL from it. No `itms-apps://` deep link on purpose:
 * apps.apple.com is a registered universal link, so iOS opens the App Store
 * app directly from the https URL — and unlike a custom scheme it still
 * works in WebViews and on desktop instead of dead-ending.
 *
 * Until the app ships, `appId` is `null` (see app/lib/app-links.ts) and the
 * badge swaps its "Download on the" line for "Coming soon" and stops being a
 * link — visible, labelled, and not a dead link. Same box as a live badge, so
 * it stays level with the Play badge beside it. See AppStoreBadge.
 */
export default function AppStoreButton({
  appId,
  className = "",
  color,
}: {
  /** Apple App Store ID — the bare number, e.g. `6771356608`. `null`/missing
   *  → inert "coming soon" badge. */
  appId?: string | null;
  className?: string;
  /** Override the badge color. Defaults to `currentColor` (inherits
   *  from the surrounding text color). */
  color?: string;
}) {
  if (!appId) {
    return (
      <span
        role="img"
        aria-label="App Store — coming soon"
        className={`inline-block cursor-default ${className}`}
      >
        <AppStoreBadge
          color={color}
          comingSoon
          className="h-12 w-auto lg:h-[58.66px]"
        />
      </span>
    );
  }

  const badge = (
    <AppStoreBadge color={color} className="h-12 w-auto lg:h-[58.66px]" />
  );

  return (
    <a
      href={`https://apps.apple.com/app/id${appId}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download on the App Store"
      className={`inline-block text-muted transition-opacity hover:opacity-90 ${className}`}
    >
      {badge}
    </a>
  );
}
