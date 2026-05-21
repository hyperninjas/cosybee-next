import type { Metadata } from "next";
import Hero from "../components/sections/solar/Hero";
import EnergyMonitoring from "../components/sections/solar/EnergyMonitoring";
import EnergyForecasting from "../components/sections/solar/EnergyForecasting";
import EnergyAnalytics from "../components/sections/solar/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/solar/SmartEnergyManagement";
// import WhyEnergieBee from "../components/sections/solar/WhyEnergieBee";
import WhyEnergiebeeSolar from "../components/sections/solar/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/solar/WorksWithAnySystem";

export const metadata: Metadata = {
  title: "Solar Forecasting & Optimisation",
  description:
    "95% accurate next-day solar forecasting. Energiebee uses AI and weather data to predict generation, schedule loads, and maximise the return on your solar investment.",
  keywords: [
    "solar forecasting",
    "solar production prediction",
    "solar energy management",
    "AI solar optimisation",
    "solar savings UK",
  ],
  alternates: { canonical: "/solar" },
  openGraph: {
    url: "/solar",
    title: "Solar Forecasting & Optimisation — energiebee",
    description:
      "95% accurate next-day solar forecasting. Plan your energy usage with confidence and maximise your solar investment.",
  },
};

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <EnergyMonitoring />
      <EnergyAnalytics />
      <SmartEnergyManagement />
      {/* <WhyEnergieBee /> */}
      <WhyEnergiebeeSolar />
      <WorksWithAnySystem />
      <EnergyForecasting />
    </main>
  );
}
