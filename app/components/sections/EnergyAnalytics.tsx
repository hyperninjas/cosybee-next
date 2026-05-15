import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import { PHOTOS } from "@/app/lib/photos";
import AnalyticsPhone from "../mockups/AnalyticsPhone";
import Hexagon from "../ui/Hexagon";
import SharedImageHexCluster from "../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../ui/SectionContent";

export default function EnergyAnalytics() {
  return (
    <section className="relative overflow-hidden bg-neutral-50 py-16 sm:py-20 lg:py-24">
      {/* decorative light hex bleeding from left edge */}
      <Hexagon
        color="#E5E7EB"
        className="pointer-events-none absolute -left-32 top-1/2 hidden w-[14rem] -translate-y-1/2 sm:block lg:-left-36 lg:w-[18rem]"
      />

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-10 lg:px-12">
        {/* left: uniform 3-hex hive cluster */}
        <div className="mx-auto aspect-[350/346] w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]">
          <SharedImageHexCluster
            src={PHOTOS.worker}
            viewBox={HIVE_3_VIEWBOX}
            placements={HIVE_3_PLACEMENTS}
            fallbackColor="#3a4a5c"
          />
        </div>

        {/* middle: title + features */}
        <div>
          <SectionTitle>Energy &amp; Savings Analytics</SectionTitle>
          <div className="mt-8 space-y-7">
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
        <div className="flex justify-center lg:justify-end">
          <AnalyticsPhone className="w-[260px] sm:w-[280px] lg:w-[290px]" />
        </div>
      </div>
    </section>
  );
}
