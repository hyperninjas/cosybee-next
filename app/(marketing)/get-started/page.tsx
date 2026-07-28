import type { Metadata } from "next";
import ComingSoon from "@/app/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Guided EnergieBee onboarding is on its way. Explore what the app can do across heating, solar, and energy management in the meantime.",
  alternates: { canonical: "/get-started" },
  robots: { index: false, follow: true },
};

export default function GetStartedPage() {
  return (
    <ComingSoon
      eyebrow="Onboarding"
      title="Get Started With EnergieBee"
      description="Our guided onboarding flow is on its way. In the meantime, explore what the app can do across heating, solar, and energy management."
      cta={{ label: "Explore the product", href: "/" }}
    />
  );
}
