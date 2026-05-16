import type { Metadata } from "next";
import ComingSoon from "../components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Guides, tutorials, and energy-saving tips from the energiebee team.",
  alternates: { canonical: "/learn" },
  robots: { index: false, follow: true },
};

export default function LearnPage() {
  return (
    <ComingSoon
      title="Learn"
      description="Guides, tutorials, and energy-saving tips from the energiebee team. We're writing them now — back soon with everything you need to know."
    />
  );
}
