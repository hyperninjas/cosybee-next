import type { Metadata } from "next";
import Hero from "@/app/components/sections/contact/Hero";
import GetInTouch from "@/app/components/sections/contact/GetInTouch";

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
      <Hero />
      <GetInTouch />
    </main>
  );
}
