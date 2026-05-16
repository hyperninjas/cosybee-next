import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import Hexagon from "../../ui/Hexagon";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-monitoring.png";

export default function EnergyMonitoring() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-28">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={sideImage.src}
          gap={5}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
        />
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -top-13.5 w-[18rem] sm:-right-27 sm:w-88 lg:w-76.75"
        />
        {/* text */}
        <div className="z-9">
          <SectionTitle>AI-Powered Insights</SectionTitle>
          <div className="mt-8 space-y-8">
            <FeatureItem
              title="Real-Time Device Tracking"
              description="See exactly what every connected appliance is doing right now, with instant updates on power draw and on/off status."
            />
            <FeatureItem
              title="Predictive Scheduling"
              description="AI learns your habits and pre-runs energy-hungry devices when grid rates are at their lowest."
            />
            <FeatureItem
              title="Anomaly Alerts"
              description="Get notified the moment a device draws unusual power — catch faulty hardware before it costs you a fortune."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
