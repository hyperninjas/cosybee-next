import type { Metadata } from "next";
import QRCode from "qrcode";
import { pageMetadata } from "@/app/lib/seo";
import { url } from "@/app/lib/site";
import JsonLd from "@/app/components/JsonLd";
import {
  breadcrumbSchema,
  softwareApplicationSchema,
} from "@/app/lib/structured-data";
import AppFeatureCards from "@/app/components/sections/download/AppFeatureCards";
import Benefits from "@/app/components/sections/download/Benefits";
import DownloadHero from "@/app/components/sections/download/DownloadHero";
import GettingStarted from "@/app/components/sections/download/GettingStarted";
import GettingStartedV2 from "@/app/components/sections/download/GettingStartedV2";
import MobileAppPromo from "@/app/components/sections/download/MobileAppPromo";
import MobileAppPromoV2 from "@/app/components/sections/download/MobileAppPromoV2";

export const metadata: Metadata = pageMetadata({
  // Absolute title (no brand-suffix template) so the primary keywords lead the
  // <title>: brand + intent ("download") + platforms.
  title: "Download EnergieBee — Free Smart Energy App for iOS & Android",
  absoluteTitle: true,
  description:
    "Download EnergieBee free for iPhone and Android — smart heating, solar forecasting, and energy analytics for your whole home in one app.",
  ogDescription:
    "One free app for your whole home's energy — heating, solar, and analytics. Get EnergieBee on iOS and Android.",
  path: "/download",
  keywords: [
    "download EnergieBee",
    "EnergieBee app",
    "energy app download",
    "smart home app iOS",
    "smart home app Android",
    "home energy monitoring app",
  ],
});

export default async function DownloadPage() {
  // The QR points at this page rather than a store: scanning on a phone lands
  // on the device-aware buttons above, so the same code stays correct before
  // and after launch and for both platforms.
  const qrSvg = await QRCode.toString(url("/download"), {
    type: "svg",
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Download", path: "/download" },
        ])}
      />
      <JsonLd data={softwareApplicationSchema()} />
      <DownloadHero qrSvg={qrSvg} />
      <GettingStarted />
      <GettingStartedV2 />
      <MobileAppPromo />
      <MobileAppPromoV2 />
      <Benefits />
      <AppFeatureCards />
    </main>
  );
}
