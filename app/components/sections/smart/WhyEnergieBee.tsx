import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionLead, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/why-energieBee.png";
import Image from "next/image";
import deviceImg from "@/public/energy-saving-device.png";

export default function WhyEnergieBee() {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 sm:py-20 lg:py-25">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-10">
        {/* left: phone (absolute, bleeds into the section like EnergyAnalytics) */}
        <div className="hidden lg:block lg:justify-end absolute left-0 -top-7 max-w-[345.3px]">
          <Image src={deviceImg} alt="energy analytics dashboard" />
        </div>

        {/* middle: title + lead + feature cards */}
        <div className="max-w-111.5 z-9">
          <SectionTitle>Works With Your Smart Home</SectionTitle>
          <SectionLead>
            Part of the energiebee app — everything you need to control,
            monitor, and optimize every device in your home.
          </SectionLead>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Maximize Comfort"
              description="Keep your home perfectly conditioned without overusing energy — automations handle the balance for you."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="See exactly how much money your smart automations save you each month with detailed analytics."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Insights"
              description="Get personalized insights on how each device contributes to your energy bill, and where to trim waste."
            />
          </div>
        </div>

        {/* right: 3-hex hive cluster — installer photo masked through the hive */}
        <SharedImageHexCluster
          src={sideImage.src}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          fallbackColor="#3a4a5c"
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 absolute -right-40 top-0 transform-[scaleX(-1)] hidden lg:block"
        />
      </div>
    </section>
  );
}
