import type { Metadata } from "next";
import ContactSection from "../components/sections/home/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the EnergieBee team — we'd love to hear from you.",
  alternates: { canonical: "/contact" },
  openGraph: {
    url: "/contact",
    title: "Contact — EnergieBee",
    description:
      "Get in touch with the EnergieBee team — we'd love to hear from you.",
  },
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      <ContactSection />
    </main>
  );
}
