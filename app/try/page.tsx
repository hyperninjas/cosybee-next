import type { Metadata } from "next";
import ComingSoon from "../components/layout/ComingSoon";

export const metadata: Metadata = {
  title: "Try energiebee",
  description:
    "Take energiebee for a spin before you commit. Free trial coming soon.",
  alternates: { canonical: "/try" },
  robots: { index: false, follow: true },
};

export default function TryPage() {
  return (
    <ComingSoon
      eyebrow="Free trial"
      title="Try energiebee"
      description="Take the app for a spin before you commit. Our free trial is being polished — back soon with the details."
      cta={{ label: "Back to home", href: "/" }}
    />
  );
}
