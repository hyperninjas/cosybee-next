import type { Metadata } from "next";
import ComingSoon from "@/app/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Start Saving",
  description:
    "Set up your EnergieBee device and start monitoring your home energy.",
  alternates: { canonical: "/start" },
  robots: { index: false, follow: true },
};

export default function StartPage() {
  return (
    <ComingSoon
      eyebrow="Get started"
      title="Start Saving With EnergieBee"
      description="The sign-up flow is on its way. In the meantime, explore the product across heating, solar, and energy management."
      cta={{ label: "Explore the product", href: "/" }}
    />
  );
}
