import type { Metadata } from "next";
import ComingSoon from "@/app/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Get the EnergieBee app on iOS and Android. Download links coming soon.",
  alternates: { canonical: "/download" },
  robots: { index: false, follow: true },
};

export default function DownloadPage() {
  return (
    <ComingSoon
      eyebrow="Get the app"
      title="Download EnergieBee"
      description="The iOS and Android apps are in final QA. App Store and Play Store links will land here on launch."
      cta={{ label: "Back to home", href: "/" }}
    />
  );
}
