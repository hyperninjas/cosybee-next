import type { Metadata } from "next";
import ComingSoon from "../components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Sign up, set up your EnergieBee device, and start saving on day one.",
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
