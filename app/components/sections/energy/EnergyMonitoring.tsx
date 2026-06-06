import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import Hexagon from "../../ui/Hexagon";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-monitoring.png";

export default function EnergyMonitoring() {
  return (
    <section className="relative overflow-hidden bg-surface py-16 text-foreground lg:py-20">
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
        <div className="z-9 flex flex-col max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>Whole-Home Monitoring</SectionTitle>
          <div className="mt-8 space-y-8">
            <FeatureItem
              title="Live Consumption Tracking"
              description="Real-time view of how much power your home is using, where it's coming from, and where it's going."
            />
            <FeatureItem
              title="Per-Device Breakdown"
              description="Pinpoint the energy hogs in your home with AI-powered appliance disaggregation — no extra sensors needed."
            />
            <FeatureItem
              title="Tariff-Aware Forecasting"
              description="See your projected bill at any moment of the day, so there are no end-of-month surprises."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
