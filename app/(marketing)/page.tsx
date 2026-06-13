import type { Metadata } from "next";
import HomeHero from "@/app/components/sections/home/HomeHero";
import PerfectHarmony from "@/app/components/sections/home/PerfectHarmony";
import HeatingSolutions from "@/app/components/sections/home/HeatingSolutions";
import HomeSolarForecasting from "@/app/components/sections/home/HomeSolarForecasting";
import HomeEnergyManagement from "@/app/components/sections/home/HomeEnergyManagement";
// import WhyThousands from "@/app/components/sections/home/WhyThousands";
import ReadyToReduce from "@/app/components/sections/home/ReadyToReduce";
import Faq from "@/app/components/sections/Faq";
import { GENERAL_FAQ } from "@/app/lib/faq-data";
import JsonLd from "@/app/components/JsonLd";
import { softwareApplicationSchema } from "@/app/lib/structured-data";

export const metadata: Metadata = {
  // Use the layout's default title (no template) for the home page itself.
  title: {
    absolute: "EnergieBee — One App. Total Energy Clarity.",
  },
  description:
    "Smart home energy control that pays for itself. Connect every device, automate heating and solar, and save up to £300 a year vs tado — all from one app.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "EnergieBee — One App. Total Energy Clarity.",
    description:
      "Smart home energy control that pays for itself. Connect every device, automate heating and solar, and save up to £300 a year vs tado.",
  },
};

export default function Home() {
  return (
    <main className="flex-1">
      <JsonLd data={softwareApplicationSchema()} />
      <HomeHero />
      <PerfectHarmony />
      <HeatingSolutions />
      <HomeSolarForecasting />
      <HomeEnergyManagement />
      {/* <WhyThousands /> */}
      <Faq items={GENERAL_FAQ} />
      <ReadyToReduce />
    </main>
  );
}
