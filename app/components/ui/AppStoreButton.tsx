"use client";

import AppStoreBadge from "./AppStoreBadge";

export default function AppStoreButton({
  appId,
  className = "",
  color,
}: {
  /** Apple App Store ID. Omit/null → inert "coming soon" badge. */
  appId?: string | null;
  className?: string;
  color?: string;
}) {
  const badge = (
    <AppStoreBadge color={color} className="h-12 w-auto lg:h-[58.66px]" />
  );

  if (!appId) {
    return (
      <span
        aria-label="Download on the App Store — coming soon"
        className={`inline-block cursor-default text-muted opacity-90 ${className}`}
      >
        {badge}
      </span>
    );
  }

  const webUrl = `https://apps.apple.com/app/id${appId}`;
  const appUrl = `itms-apps://itunes.apple.com/app/id${appId}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isiOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS

    if (isiOS) {
      e.preventDefault();
      window.location.href = appUrl;
    }
  };

  return (
    <a
      href={webUrl}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download on the App Store"
      className={`inline-block text-muted transition-opacity hover:opacity-90 ${className}`}
    >
      {badge}
    </a>
  );
}
