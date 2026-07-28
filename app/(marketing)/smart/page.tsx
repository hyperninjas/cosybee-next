import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import Hero from "@/app/components/sections/smart/Hero";
import EnergyMonitoring from "@/app/components/sections/smart/EnergyMonitoring";
// import EnergyForecasting from "@/app/components/sections/smart/EnergyForecasting";
import EnergyAnalytics from "@/app/components/sections/smart/EnergyAnalytics";
import SmartEnergyManagement from "@/app/components/sections/smart/SmartEnergyManagement";
import WhyEnergieBee from "@/app/components/sections/smart/WhyEnergieBee";
// import WhyEnergieBeeSolar from "@/app/components/sections/smart/WhyEnergiebeeSolar";
import WorksWithAnySystem from "@/app/components/sections/smart/WorksWithAnySystem";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema } from "@/app/lib/structured-data";
// import Faq from "@/app/components/sections/Faq";
// import { GENERAL_FAQ } from "@/app/lib/faq-data";

export const metadata: Metadata = pageMetadata({
  title: "Smart Home Integration",
  description:
    "Connect your solar system, battery, and smart home devices in one intelligent platform. AI-powered insights show energy production, usage, and savings at a glance.",
  ogDescription:
    "Solar, battery, and smart devices together in one platform — with AI-powered insights on energy production, usage, and savings.",
  path: "/smart",
  keywords: [
    "smart home energy",
    "smart home integration",
    "connected home devices",
    "solar battery monitoring",
    "AI energy insights",
    "energy independence",
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
      {/* <WhyEnergieBeeSolar /> */}
      <WorksWithAnySystem />
      {/* <EnergyForecasting /> */}
      {/* <Faq items={GENERAL_FAQ} /> */}
    </main>
  );
}
