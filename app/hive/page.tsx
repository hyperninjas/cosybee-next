import type { Metadata } from "next";
import ComingSoon from "../components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "The Hive",
  description: "Community, support, and product updates for energiebee users.",
  alternates: { canonical: "/hive" },
  robots: { index: false, follow: true },
};

export default function HivePage() {
  return (
    <ComingSoon
      title="The Hive"
      description="Community, support, and product updates for energiebee users. We're getting it ready — check back soon."
    />
  );
}
