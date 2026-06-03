import type { Metadata } from "next";
import HomeHero from "./components/sections/home/HomeHero";
import PerfectHarmony from "./components/sections/home/PerfectHarmony";
import HeatingSolutions from "./components/sections/home/HeatingSolutions";
import HomeSolarForecasting from "./components/sections/home/HomeSolarForecasting";
import HomeEnergyManagement from "./components/sections/home/HomeEnergyManagement";
// import WhyThousands from "./components/sections/home/WhyThousands";
import ReadyToReduce from "./components/sections/home/ReadyToReduce";
import JsonLd from "./components/JsonLd";
import { softwareApplicationSchema } from "./lib/structured-data";

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
      <ReadyToReduce />
    </main>
  );
}
