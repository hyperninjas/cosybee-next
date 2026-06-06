import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-analytics-side.png";
import deviceImg from "@/public/energy/energiebee-octopus-energy-tariff-dashboard.png";
import Image from "next/image";

export default function EnergyAnalytics() {
  return (
    <section className="relative overflow-hidden bg-background py-12 sm:py-16 min-[1200px]:py-32 px-6 lg:px-0">
      {/* decorative light hex bleeding from left edge */}
      {/* <Hexagon
        color="#E5E7EB"
        className="pointer-events-none absolute -left-32 top-1/2 hidden w-56 -translate-y-1/2 sm:block sm:-right-27 sm:w-88 lg:w-76.75"
      /> */}

      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12  lg:gap-10">
        {/* left: uniform 3-hex hive cluster — wrapper holds the absolute
            positioning + explicit width so the inner `w-full` resolves
            against a non-zero containing block */}
        <div className="absolute -left-50 -top-10 hidden w-125.5 min-[1200px]:block">
          <SharedImageHexCluster
            src={sideImage.src}
            viewBox={HIVE_3_VIEWBOX}
            placements={HIVE_3_PLACEMENTS}
            fallbackColor="#3a4a5c"
            className="w-full"
          />
        </div>
        {/* middle: title + features */}
        <div className="min-[1200px]:max-w-111.5 max-[1200px]:max-w-160 flex flex-col justify-center max-[1200px]:items-center">
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
          {/* inline phone for tablet/mobile — side images hidden below 1200px */}
          <div className="w-75 min-[1200px]:hidden mt-10">
            <Image
              src={deviceImg}
              alt="energy analytics dashboard"
              sizes="(min-width: 1024px) 300px, 280px"
              quality={85}
              className="h-auto w-full"
            />
          </div>
        </div>
        {/* right: analytics phone — wrapper has explicit width, image
            fills it via w-full h-auto so it scales proportionally */}
        <div className="absolute -top-20 right-0 hidden w-75 min-[1200px]:block">
          <Image
            src={deviceImg}
            alt="energy analytics dashboard"
            sizes="(min-width: 1024px) 300px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
