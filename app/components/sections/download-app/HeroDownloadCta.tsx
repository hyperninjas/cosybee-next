"use client";

import AppStoreButton from "@/app/components/ui/AppStoreButton";
import GooglePlayButton from "@/app/components/ui/GooglePlayButton";
import { useDevicePlatform } from "@/app/hooks/useDevicePlatform";
import { APP_STORE_ID, PLAY_STORE_PACKAGE_NAME } from "@/app/lib/app-links";

/**
 * Device-aware download CTA for the hero. SSR renders a neutral state (both
 * store badges) so crawlers and no-JS visitors see every option; once the
 * platform is detected only the matching badge remains — and desktop visitors
 * (Mac/Windows) get a QR code instead, since they can't install from here.
 *
 * `qrSvg` is the QR markup pre-rendered on the server (see downloadQrSvg in
 * app/lib/download-qr.ts), so no QR library ships to the client. It points at
 * /download-app: scanning on a phone lands on that page's device-aware CTA, so
 * the same code stays correct before and after launch and for both platforms.
 *
 * Both layouts are server-rendered and CSS picks one before JS runs (the QR
 * panel on fine-pointer devices, the badge row on touch). Swapping one for the
 * other after hydration moved the hero copy and was the page's whole CLS; now
 * the detected platform only corrects the rare device the media query guesses
 * wrong (e.g. an iPad with a trackpad).
 */
export default function HeroDownloadCta({ qrSvg }: { qrSvg: string }) {
  const platform = useDevicePlatform();

  const panelVisibility =
    platform === null
      ? "hidden pointer-fine:flex"
      : platform === "desktop"
        ? "flex"
        : "hidden";
  const badgesVisibility =
    platform === null
      ? "flex pointer-fine:hidden"
      : platform === "desktop"
        ? "hidden"
        : "flex";

  return (
    <>
      <div
        className={`${panelVisibility} flex-col items-stretch gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm`}
      >
        {/* QR — scan to open this page on a phone */}
        <div className="flex flex-col items-center gap-2">
          <div
            role="img"
            aria-label="QR code linking to the EnergieBee download page"
            className="h-34 w-34 shrink-0 rounded-xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="text-[13px] leading-[100%] font-medium text-white/70">
            Scan to download
          </p>
        </div>

        {/* <div aria-hidden className="w-px self-stretch bg-white/20" /> */}

        {/* both store badges, so desktop visitors can go straight to their
            store as well as scan */}
        <div className="flex flex-col justify-center gap-2.5">
          <AppStoreButton appId={APP_STORE_ID} />
          {/* <GooglePlayButton packageName={PLAY_STORE_PACKAGE_NAME} /> */}
        </div>
      </div>

      <div className={`${badgesVisibility} flex-wrap items-center gap-4`}>
        {platform !== "android" && <AppStoreButton appId={APP_STORE_ID} />}
        {platform !== "ios" && (
          <GooglePlayButton packageName={PLAY_STORE_PACKAGE_NAME} />
        )}
      </div>
    </>
  );
}
