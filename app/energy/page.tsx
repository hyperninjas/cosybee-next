import type { Metadata } from "next";
import Hero from "../components/sections/energy/Hero";
import EnergyMonitoring from "../components/sections/energy/EnergyMonitoring";
import EnergyForecasting from "../components/sections/energy/EnergyForecasting";
import EnergyAnalytics from "../components/sections/energy/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/energy/SmartEnergyManagement";
import WhyEnergieBee from "../components/sections/energy/WhyEnergieBee";
import WhyEnergieBeeSolar from "../components/sections/energy/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/energy/WorksWithAnySystem";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structured-data";

export const metadata: Metadata = {
  title: "Total Energy Control",
  description:
    "Track every watt your home uses across grid, solar, battery, and devices. AI-driven tariff shifting, bill forecasting, and battery arbitrage cut your bill up to 40%.",
  keywords: [
    "home energy monitoring",
    "energy usage tracking",
    "smart tariff",
    "battery arbitrage",
    "EV charging optimisation",
    "tariff comparison UK",
  ],
  alternates: { canonical: "/energy" },
  openGraph: {
    url: "/energy",
    title: "Total Energy Control — EnergieBee",
    description:
      "Every watt your home uses, in one dashboard. AI-driven tariff shifting and bill forecasting that cuts your bill up to 40%.",
  },
};

export default function EnergyPage() {
  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Total Energy Control", path: "/energy" },
        ])}
      />
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
