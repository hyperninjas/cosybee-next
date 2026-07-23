/**
 * "Get it on Google Play" badge, sized to pair with AppStoreButton (same
 * `h-12 lg:h-[58.66px]` rhythm). The play triangle is inline SVG; the text is
 * HTML so it stays crisp and picks up the site font.
 *
 * Takes the bare Android application ID (see app/lib/app-links.ts) and builds
 * the https listing URL from it. No `market://` deep link on purpose:
 * play.google.com is a verified app link, so Android opens the Play Store app
 * directly from the https URL — and unlike a custom scheme it still works in
 * WebViews, on Play-less devices and on desktop instead of failing with
 * ERR_UNKNOWN_URL_SCHEME.
 *
 * Pass `packageName={null}` (the pre-launch default from app-links.ts) to
 * render the badge inert — visible but not a link — until the listing exists.
 */
export default function GooglePlayButton({
  packageName,
  className = "",
  bgColor = "black",
}: {
  /** Android application ID, e.g. `com.energiebee.app`. `null`/missing →
   *  inert "coming soon" badge. */
  packageName?: string | null;
  className?: string;
  /** Rounded-rectangle background fill. Defaults to black to match AppStoreBadge. */
  bgColor?: string;
}) {
  const badge = (
    <span
      className="inline-flex h-12 w-auto items-center gap-2.5 rounded-[9px] px-4 lg:h-[58.66px] lg:gap-3 lg:px-5"
      style={{ backgroundColor: bgColor }}
    >
      <svg
        viewBox="0 0 28.2 31"
        className="h-6 w-auto lg:h-7"
        aria-hidden
        fill="none"
      >
        <path
          fill="#00C3FF"
          d="M1 .7 14.9 15.5 1 30.3C.4 29.9 0 29.2 0 28.3V2.7C0 1.8.4 1.1 1 .7Z"
        />
        <path
          fill="#00E76A"
          d="M2.6.2c.7-.3 1.5-.2 2.2.2l16.1 9.1-4.7 4.7L2.6.2Z"
        />
        <path
          fill="#FF3A44"
          d="m2.6 30.8 13.6-14 4.7 4.7-16.1 9.1c-.7.4-1.5.5-2.2.2Z"
        />
        <path
          fill="#FFD500"
          d="m17.1 15.5 4.7-4.7 5.1 2.9c1.7.95 1.7 2.65 0 3.6l-5.1 2.9-4.7-4.7Z"
        />
      </svg>

      <span className="flex flex-col items-start leading-none text-white">
        <span className="text-[9px] font-medium uppercase tracking-[0.08em] lg:text-[11px]">
          Get it on
        </span>
        <span className="mt-0.5 text-lg font-semibold lg:mt-1 lg:text-[21px]">
          Google Play
        </span>
      </span>
    </span>
  );

  if (!packageName) {
    return (
      <span
        aria-label="Get it on Google Play — coming soon"
        className={`inline-block cursor-default opacity-90 ${className}`}
      >
        {badge}
      </span>
    );
  }

  return (
    <a
      href={`https://play.google.com/store/apps/details?id=${packageName}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get it on Google Play"
      className={`inline-block transition-opacity hover:opacity-90 ${className}`}
    >
      {badge}
    </a>
  );
}
