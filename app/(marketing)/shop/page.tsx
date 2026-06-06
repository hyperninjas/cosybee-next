import type { Metadata } from "next";
import ComingSoon from "../components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Shop",
  description: "EnergieBee devices, bundles, and accessories.",
  alternates: { canonical: "/shop" },
  robots: { index: false, follow: true },
};

export default function ShopPage() {
  return (
    <ComingSoon
      title="Shop"
      description="Devices, bundles, and accessories. The storefront is opening soon — sign up for the launch and we'll let you know the moment it goes live."
    />
  );
}
