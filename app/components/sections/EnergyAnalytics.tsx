import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../ui/SectionContent";
import sideImage from "@/public/energy-analytics-side.png";
import deviceImg from "@/public/energy-saving-device.png";
import Image from "next/image";

export default function EnergyAnalytics() {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 sm:py-20 lg:py-47">
      {/* decorative light hex bleeding from left edge */}
      {/* <Hexagon
        color="#E5E7EB"
        className="pointer-events-none absolute -left-32 top-1/2 hidden w-56 -translate-y-1/2 sm:block sm:-right-27 sm:w-88 lg:w-76.75"
      /> */}

      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12  lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-10">
        {/* left: uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={sideImage.src}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          fallbackColor="#3a4a5c"
          // bgPosition="right 120%"
          // bgSize="cover"
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 absolute -left-50 -top-10 hidden lg:block"
        />
        {/* middle: title + features */}
        <div className="max-w-111.5">
          <SectionTitle>Energy &amp; Savings Analytics</SectionTitle>
          <div className="mt-8 space-y-8">
            <FeatureItem
              title="Savings Calculator"
              description="Track exactly how much money you're saving with solar. See monthly comparisons and cumulative savings over time."
            />
            <FeatureItem
              title="Grid Independence Metrics"
              description="Monitor your energy independence level. Understand how much of your power comes from solar vs. the grid."
            />
            <FeatureItem
              title="Carbon Footprint Impact"
              description="Visualize your positive environmental impact with CO2 reduction metrics. See how much you're helping the planet."
            />
          </div>
        </div>
        {/* right: analytics phone */}
        <div className="flex justify-center lg:justify-end absolute right-0 -top-20 max-h-146.5 max-w-[286.3px] hidden lg:block">
          {/* <AnalyticsPhone className="w-[260px] sm:w-[280px] lg:w-[290px]" /> */}
          <Image src={deviceImg} alt="energy analytics dashboard" />
        </div>
      </div>
    </section>
  );
}
