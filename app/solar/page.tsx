import type { Metadata } from "next";
import Hero from "../components/sections/solar/Hero";
import EnergyMonitoring from "../components/sections/solar/EnergyMonitoring";
import EnergyForecasting from "../components/sections/solar/EnergyForecasting";
import EnergyAnalytics from "../components/sections/solar/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/solar/SmartEnergyManagement";
// import WhyEnergieBee from "../components/sections/solar/WhyEnergieBee";
import WhyEnergieBeeSolar from "../components/sections/solar/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/solar/WorksWithAnySystem";
import JsonLd from "../components/JsonLd";
import Faq from "../components/sections/Faq";
import { breadcrumbSchema } from "../lib/structured-data";
import { SOLAR_FAQ } from "../lib/faq-data";

export const metadata: Metadata = {
  title: "Solar Forecasting & Optimisation",
  description:
    "95% accurate next-day solar forecasting. EnergieBee uses AI and weather data to predict generation, schedule loads, and maximise the return on your solar investment.",
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
    title: "Solar Forecasting & Optimisation — EnergieBee",
    description:
      "95% accurate next-day solar forecasting. Plan your energy usage with confidence and maximise your solar investment.",
  },
};

export default function Home() {
  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Solar Forecasting & Optimisation", path: "/solar" },
        ])}
      />
      <Hero />
      <EnergyMonitoring />
      <EnergyAnalytics />
      <SmartEnergyManagement />
      <WhyEnergieBeeSolar />
      <WorksWithAnySystem />
      <EnergyForecasting />
      <Faq items={SOLAR_FAQ} />
    </main>
  );
}
