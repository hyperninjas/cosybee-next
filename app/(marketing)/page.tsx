import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import HomeHero from "@/app/components/sections/home/HomeHero";
import PerfectHarmony from "@/app/components/sections/home/PerfectHarmony";
import HeatingSolutions from "@/app/components/sections/home/HeatingSolutions";
import HomeSolarForecasting from "@/app/components/sections/home/HomeSolarForecasting";
import HomeEnergyManagement from "@/app/components/sections/home/HomeEnergyManagement";
// import WhyThousands from "@/app/components/sections/home/WhyThousands";
import HomeFeaturedArticles from "@/app/components/sections/home/HomeFeaturedArticles";
import ReadyToReduce from "@/app/components/sections/home/ReadyToReduce";
import Faq from "@/app/components/sections/Faq";
import { GENERAL_FAQ } from "@/app/lib/faq-data";
import JsonLd from "@/app/components/JsonLd";
import { softwareApplicationSchema } from "@/app/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  // Use an absolute title (no brand template) for the home page itself.
  title: "EnergieBee — One App. Total Energy Clarity.",
  absoluteTitle: true,
  description:
    "Smart home energy control that pays for itself. Connect every device, automate heating and solar, and save up to £300 a year vs tado — all from one app.",
  ogDescription:
    "Smart home energy control that pays for itself. Connect every device, automate heating and solar, and save up to £300 a year vs tado.",
  path: "/",
});

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
      <HomeFeaturedArticles />
      <Faq items={GENERAL_FAQ} />
      <ReadyToReduce />
    </main>
  );
}
