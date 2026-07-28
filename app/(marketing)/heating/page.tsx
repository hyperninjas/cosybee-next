import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import Hero from "@/app/components/sections/heating/Hero";
import AccurateIntelligence from "@/app/components/sections/heating/AccurateIntelligence";
import UnderstandOptimise from "@/app/components/sections/heating/UnderstandOptimise";
import TurnEnergyData from "@/app/components/sections/heating/TurnEnergyData";
import SmarterUnderstanding from "@/app/components/sections/heating/SmarterUnderstanding";
import ConnectedEcosystem from "@/app/components/sections/heating/ConnectedEcosystem";
import WhyChoose from "@/app/components/sections/heating/WhyChoose";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema } from "@/app/lib/structured-data";
// import Faq from "@/app/components/sections/Faq";
// import { GENERAL_FAQ } from "@/app/lib/faq-data";

export const metadata: Metadata = pageMetadata({
  title: "Home Heating Intelligence",
  description:
    "Predictive heating intelligence that helps you understand, optimise, and reduce home heating consumption. Climate-aware forecasting — early access ahead of the August 2026 launch.",
  ogDescription:
    "Understand and optimise your home heating with predictive, climate-aware intelligence. Early access is open ahead of the August 2026 launch.",
  path: "/heating",
  keywords: [
    "home heating intelligence",
    "heating energy forecasting",
    "reduce heating consumption",
    "climate-aware energy insights",
    "heating energy savings",
    "connected home energy",
  ],
});

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
      {/* <Faq items={GENERAL_FAQ} /> */}
    </main>
  );
}
