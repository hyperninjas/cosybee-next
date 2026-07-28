import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import Hero from "@/app/components/sections/contact/Hero";
import GetInTouch from "@/app/components/sections/contact/GetInTouch";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with the EnergieBee team in Royton, Oldham — send a message, email support@energiebee.com, or join the newsletter for energy tips and updates.",
  ogDescription:
    "Questions about EnergieBee? Send us a message or email support@energiebee.com — we'd love to hear from you.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="flex-1">
      <Hero />
      <GetInTouch />
    </main>
  );
}
