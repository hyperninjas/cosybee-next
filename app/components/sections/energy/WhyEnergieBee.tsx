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
          <SectionTitle>Why Choose energiebee Energy?</SectionTitle>
          <SectionLead>
            Part of the energiebee app — one dashboard for every kilowatt-hour,
            every device, every cost.
          </SectionLead>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="See Everything"
              description="Grid, solar, battery, and individual devices — all on one timeline, with the same units and the same clarity."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="Every automation logged with its hard-dollar impact. Know what's working and what's not."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Analytics"
              description="Trend detection, anomaly alerts, and bill projections — the analytics you'd build if you had the time."
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
