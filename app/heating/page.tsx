import type { Metadata } from "next";
import Hero from "../components/sections/heating/Hero";
import AccurateIntelligence from "../components/sections/heating/AccurateIntelligence";
import UnderstandOptimise from "../components/sections/heating/UnderstandOptimise";
import TurnEnergyData from "../components/sections/heating/TurnEnergyData";
import SmarterUnderstanding from "../components/sections/heating/SmarterUnderstanding";
import ConnectedEcosystem from "../components/sections/heating/ConnectedEcosystem";
import WhyChoose from "../components/sections/heating/WhyChoose";

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
      <Hero />
      <AccurateIntelligence />
      <UnderstandOptimise />
      <TurnEnergyData />
      <SmarterUnderstanding />
      <ConnectedEcosystem />
      <WhyChoose />
    </main>
  );
}
