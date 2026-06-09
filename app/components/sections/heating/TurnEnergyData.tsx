import Hexagon from "../../ui/Hexagon";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImg from "@/public/energy-management.png";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";

export default function TurnEnergyData() {
  return (
    <section className="relative overflow-hidden bg-surface py-16 text-foreground lg:py-16">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="z-9 flex flex-col min-[550px]:max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>Turn Energy Data Into Real Savings</SectionTitle>
          <div className="mt-6 md:mt-8 space-y-8">
            <FeatureItem
              title="Savings Intelligence"
              description="Identify opportunities to reduce heating costs through smarter decisions."
            />
            <FeatureItem
              title="Grid Independence Tracking"
              description="Measure how much energy your home is saving from external grid dependency."
            />
            <FeatureItem
              title="Carbon & Efficiency Metrics"
              description="Understand your environmental impact through clear, actionable energy metrics."
            />
          </div>
        </div>

        {/* uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={sideImg.src}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
        />
      </div>
    </section>
  );
}
