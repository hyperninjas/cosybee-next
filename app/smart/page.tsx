import type { Metadata } from "next";
import Hero from "../components/sections/smart/Hero";
import EnergyMonitoring from "../components/sections/smart/EnergyMonitoring";
import EnergyForecasting from "../components/sections/smart/EnergyForecasting";
import EnergyAnalytics from "../components/sections/smart/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/smart/SmartEnergyManagement";
import WhyEnergieBee from "../components/sections/smart/WhyEnergieBee";
import WhyEnergieBeeSolar from "../components/sections/smart/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/smart/WorksWithAnySystem";

export const metadata: Metadata = {
  title: "Smart Home Integration",
  description:
    "Connect every device in your home and let EnergieBee's AI orchestrate energy usage automatically. Works with Alexa, Google Home, and Apple HomeKit out of the box.",
  keywords: [
    "smart home energy",
    "Matter smart home",
    "smart home automation",
    "Alexa energy",
    "Google Home energy",
    "Apple HomeKit",
  ],
  alternates: { canonical: "/smart" },
  openGraph: {
    url: "/smart",
    title: "Smart Home Integration — EnergieBee",
    description:
      "Connect every device and let AI orchestrate your home's energy automatically. Reduce waste, save money, stay in control.",
  },
};

export default function SmartPage() {
  return (
    <main className="flex-1">
      <Hero />
      <EnergyMonitoring />
      <EnergyAnalytics />
      <SmartEnergyManagement />
      <WhyEnergieBee />
      <WhyEnergieBeeSolar />
      <WorksWithAnySystem />
      <EnergyForecasting />
    </main>
  );
}
