import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import Hero from "@/app/components/sections/smart/Hero";
import EnergyMonitoring from "@/app/components/sections/smart/EnergyMonitoring";
// import EnergyForecasting from "@/app/components/sections/smart/EnergyForecasting";
import EnergyAnalytics from "@/app/components/sections/smart/EnergyAnalytics";
import SmartEnergyManagement from "@/app/components/sections/smart/SmartEnergyManagement";
import WhyEnergieBee from "@/app/components/sections/smart/WhyEnergieBee";
import WhyEnergieBeeSolar from "@/app/components/sections/smart/WhyEnergiebeeSolar";
import WorksWithAnySystem from "@/app/components/sections/smart/WorksWithAnySystem";
import JsonLd from "@/app/components/JsonLd";
import Faq from "@/app/components/sections/Faq";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import { GENERAL_FAQ } from "@/app/lib/faq-data";

export const metadata: Metadata = pageMetadata({
  title: "Smart Home Integration",
  description:
    "Connect every device and let EnergieBee's AI orchestrate energy automatically. Works with Alexa, Google Home, and Apple HomeKit out of the box.",
  ogDescription:
    "Connect every device and let AI orchestrate your home's energy automatically. Reduce waste, save money, stay in control.",
  path: "/smart",
  keywords: [
    "smart home energy",
    "Matter smart home",
    "smart home automation",
    "Alexa energy",
    "Google Home energy",
    "Apple HomeKit",
  ],
});

export default function SmartPage() {
  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Smart Home Integration", path: "/smart" },
        ])}
      />
      <Hero />
      <EnergyMonitoring />
      <EnergyAnalytics />
      <SmartEnergyManagement />
      <WhyEnergieBee />
      <WhyEnergieBeeSolar />
      <WorksWithAnySystem />
      {/* <EnergyForecasting /> */}
      <Faq items={GENERAL_FAQ} />
    </main>
  );
}
