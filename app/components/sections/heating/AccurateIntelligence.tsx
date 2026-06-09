import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import Hexagon from "../../ui/Hexagon";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-monitoring.png";

export default function AccurateIntelligence() {
  return (
    <section className="relative overflow-hidden bg-white py-16 text-black lg:py-20">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={sideImage.src}
          gap={5}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 z-9"
        />
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -top-13.5 w-[18rem] sm:-right-27 sm:w-88 lg:w-76.75"
        />
        {/* text */}
        <div className="z-9 flex flex-col min-[550px]:max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>Accurate Intelligence for a Smarter, Greener Home</SectionTitle>
          <div className="mt-6 md:mt-8 space-y-8">
            <FeatureItem
              title="High-Accuracy Energy Forecasting"
              description="Our models analyse real-time usage, system behaviour, and external conditions to predict heating demand with high precision."
            />
            <FeatureItem
              title="Climate-Aware Intelligence"
              description="We integrate live weather and environmental data to continuously adapt energy predictions and reduce wasted heating cycles."
            />
            <FeatureItem
              title="Efficiency-First System Design"
              description="Every insight is built to reduce unnecessary energy consumption — helping you save money while lowering your carbon footprint."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
