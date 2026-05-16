import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-analytics-side.png";
import deviceImg from "@/public/energy-saving-device.png";
import Image from "next/image";

export default function EnergyAnalytics() {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 sm:py-20 lg:py-45">
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
              title="Bill Forecasting"
              description="Project your monthly and annual electricity costs based on real consumption patterns — never get blindsided by a bill again."
            />
            <FeatureItem
              title="Self-Sufficiency Score"
              description="Measure what percentage of your power comes from your own solar and battery vs. the grid. Watch it climb."
            />
            <FeatureItem
              title="Carbon Footprint Impact"
              description="Track lifetime CO2 savings from every smart automation and every renewable kilowatt-hour you produce."
            />
          </div>
        </div>
        {/* right: analytics phone */}
        <div className="justify-center lg:justify-end absolute right-0 -top-20 max-h-146.5 max-w-75 hidden lg:block">
          {/* <AnalyticsPhone className="w-[260px] sm:w-[280px] lg:w-[290px]" /> */}
          <Image src={deviceImg} alt="energy analytics dashboard" sizes="(min-width: 1024px) 350px, 280px" quality={50} />
        </div>
      </div>
    </section>
  );
}
