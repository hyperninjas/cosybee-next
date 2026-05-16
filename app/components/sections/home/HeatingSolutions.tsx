import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-monitoring.png";

/**
 * "Heating Solutions" — dark variant of the monitoring layout.
 * Hive cluster on the left, title + features on the right.
 */
export default function HeatingSolutions() {
  return (
    <section className="relative overflow-hidden py-20 text-white lg:py-25">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* cluster — left */}
        <SharedImageHexCluster
          src={sideImage.src}
          gap={5}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          fallbackColor="#1a1a1a"
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
        />

        {/* text — right */}
        <div>
          <SectionTitle className="!text-white">Heating Solutions</SectionTitle>
          <div className="mt-8 space-y-7">
            <FeatureItem
              title="Live Solar Production Tracking"
              description="Monitor your solar panel energy production in real-time. See exactly how much energy you're generating with instant updates."
            />
            <FeatureItem
              title="Weather-Based Forecasts"
              description="Get accurate predictions for your solar energy output based on upcoming weather patterns, helping you plan energy usage effectively."
            />
            <FeatureItem
              title="Daily Energy Overview"
              description="View comprehensive daily energy production with visual graphs showing peak generation times and total output."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
