import type { Metadata } from "next";
import Hero from "@/app/components/sections/heating/Hero";
import AccurateIntelligence from "@/app/components/sections/heating/AccurateIntelligence";
import UnderstandOptimise from "@/app/components/sections/heating/UnderstandOptimise";
import TurnEnergyData from "@/app/components/sections/heating/TurnEnergyData";
import SmarterUnderstanding from "@/app/components/sections/heating/SmarterUnderstanding";
import ConnectedEcosystem from "@/app/components/sections/heating/ConnectedEcosystem";
import WhyChoose from "@/app/components/sections/heating/WhyChoose";
import JsonLd from "@/app/components/JsonLd";
import Faq from "@/app/components/sections/Faq";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import { HEATING_FAQ } from "@/app/lib/faq-data";

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
    title: "Smart Heating Control — EnergieBee",
    description:
      "Heating that learns your routines and adapts in real time. Stay comfortable, cut your bill up to 35%.",
  },
};

export default function HeatingPage() {
  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Smart Heating Control", path: "/heating" },
        ])}
      />
      <Hero />
      <AccurateIntelligence />
      <UnderstandOptimise />
      <TurnEnergyData />
      <SmarterUnderstanding />
      <ConnectedEcosystem />
      <WhyChoose />
      <Faq items={HEATING_FAQ} />
    </main>
  );
}
