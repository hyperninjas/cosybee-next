import type { Metadata } from "next";
import Hero from "../components/sections/heating/Hero";
import EnergyMonitoring from "../components/sections/heating/EnergyMonitoring";
import EnergyForecasting from "../components/sections/heating/EnergyForecasting";
import EnergyAnalytics from "../components/sections/heating/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/heating/SmartEnergyManagement";
import WhyEnergieBee from "../components/sections/heating/WhyEnergieBee";
import WhyEnergiebeeSolar from "../components/sections/heating/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/heating/WorksWithAnySystem";

export const metadata: Metadata = {
  title: "Smart Heating Control",
  description:
    "Intelligent heating that learns your routines and adapts in real time. Zone-based heating, geofencing, and AI boiler tuning. Cut your heating bill up to 35%.",
  keywords: [
    "smart heating",
    "smart thermostat",
    "zone heating",
    "geofencing heating",
    "boiler optimisation",
    "tado alternative",
    "heat pump control",
  ],
  alternates: { canonical: "/heating" },
  openGraph: {
    url: "/heating",
    title: "Smart Heating Control — energiebee",
    description:
      "Heating that learns your routines and adapts in real time. Stay comfortable, cut your bill up to 35%.",
  },
};

export default function HeatingPage() {
  return (
    <main className="flex-1">
      <Hero />
      <EnergyMonitoring />
      <EnergyAnalytics />
      <SmartEnergyManagement />
      <WhyEnergieBee />
      <WhyEnergiebeeSolar />
      <WorksWithAnySystem />
      <EnergyForecasting />
    </main>
  );
}
