import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import Hero from "@/app/components/sections/contact/Hero";
import GetInTouch from "@/app/components/sections/contact/GetInTouch";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with the EnergieBee team — we'd love to hear from you.",
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
