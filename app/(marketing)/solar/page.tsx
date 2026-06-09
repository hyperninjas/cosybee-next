import type { Metadata } from "next";
import Hero from "@/app/components/sections/solar/Hero";
import EnergyMonitoring from "@/app/components/sections/solar/EnergyMonitoring";
import EnergyForecasting from "@/app/components/sections/solar/EnergyForecasting";
import EnergyAnalytics from "@/app/components/sections/solar/EnergyAnalytics";
import SmartEnergyManagement from "@/app/components/sections/solar/SmartEnergyManagement";
// import WhyEnergieBee from "@/app/components/sections/solar/WhyEnergieBee";
import WhyEnergieBeeSolar from "@/app/components/sections/solar/WhyEnergiebeeSolar";
import WorksWithAnySystem from "@/app/components/sections/solar/WorksWithAnySystem";
import JsonLd from "@/app/components/JsonLd";
import Faq from "@/app/components/sections/Faq";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import { SOLAR_FAQ } from "@/app/lib/faq-data";

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
