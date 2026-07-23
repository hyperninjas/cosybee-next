import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import { downloadQrSvg } from "@/app/lib/download-qr";
import JsonLd from "@/app/components/JsonLd";
import {
  breadcrumbSchema,
  softwareApplicationSchema,
} from "@/app/lib/structured-data";
import AppFeatureCards from "@/app/components/sections/download-app/AppFeatureCards";
import Benefits from "@/app/components/sections/download-app/Benefits";
import DownloadHero from "@/app/components/sections/download-app/DownloadHero";
import GettingStarted from "@/app/components/sections/download-app/GettingStarted";
import GettingStartedV2 from "@/app/components/sections/download-app/GettingStartedV2";
// import MobileAppPromo from "@/app/components/sections/download-app/MobileAppPromo";
import MobileAppPromoV2 from "@/app/components/sections/download-app/MobileAppPromoV2";

export const metadata: Metadata = pageMetadata({
  // Absolute title (no brand-suffix template) so the primary keywords lead the
  // <title>: brand + intent ("download") + platforms.
  title: "Download EnergieBee — Free Smart Energy App for iOS & Android",
  absoluteTitle: true,
  description:
    "Download EnergieBee free for iPhone and Android — smart heating, solar forecasting, and energy analytics for your whole home in one app.",
  ogDescription:
    "One free app for your whole home's energy — heating, solar, and analytics. Get EnergieBee on iOS and Android.",
  path: "/download-app",
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
  // The QR points at this page rather than a store — see downloadQrSvg.
  const qrSvg = await downloadQrSvg();

  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Download", path: "/download-app" },
        ])}
      />
      <JsonLd data={softwareApplicationSchema()} />
      <DownloadHero qrSvg={qrSvg} />
      <GettingStarted />
      <GettingStartedV2 />
      {/* <MobileAppPromo /> */}
      <MobileAppPromoV2 />
      <Benefits />
      <AppFeatureCards />
    </main>
  );
}
