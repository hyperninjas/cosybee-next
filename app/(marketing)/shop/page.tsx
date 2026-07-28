import type { Metadata } from "next";
import ComingSoon from "@/app/components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "EnergieBee devices, bundles, and accessories — the storefront is opening soon.",
  alternates: { canonical: "/shop" },
  robots: { index: false, follow: true },
};

export default function ShopPage() {
  return (
    <ComingSoon
      title="Shop"
      description="Devices, bundles, and accessories. The storefront is opening soon — check back for the launch."
    />
  );
}
