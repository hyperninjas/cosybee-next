import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-analytics-side.png";
import deviceImg from "@/public/heating/energiebee-app-heating-system-overview.png";
import Image from "next/image";

export default function UnderstandOptimise() {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-12 sm:py-16 min-[1200px]:py-32 px-6 lg:px-0">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:gap-10">
        {/* left: uniform 3-hex hive cluster */}
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
        <div className="min-[1200px]:max-w-111.5 max-[1200px]:max-w-160 flex flex-col justify-center">
          <SectionTitle align="center">
            Understand and Optimise Your Home Energy Today
          </SectionTitle>
          <div className="mt-6 md:mt-8 space-y-8">
            <FeatureItem
              title="Real-Time Energy Forecasting"
              description="Predict heating demand using live usage patterns and system behaviour."
            />
            <FeatureItem
              title="Weather-Adaptive Insights"
              description="Adjust energy expectations based on local climate conditions."
            />
            <FeatureItem
              title="Daily Energy Overview"
              description="A simple breakdown of energy usage, efficiency, and production every day."
            />
          </div>
          {/* inline phone for tablet/mobile — side images hidden below 1200px */}
          <div className="w-75 mx-auto min-[1200px]:hidden mt-10">
            <Image
              src={deviceImg}
              alt="energy dashboard"
              sizes="(min-width: 1024px) 300px, 280px"
              quality={85}
              className="h-auto w-full"
            />
          </div>
        </div>
        {/* right: phone mockup */}
        <div className="absolute -top-20 right-0 hidden w-75 min-[1200px]:block">
          <Image
            src={deviceImg}
            alt="energy dashboard"
            sizes="(min-width: 1024px) 300px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
