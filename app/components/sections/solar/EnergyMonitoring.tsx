import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import Hexagon from "../../ui/Hexagon";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-monitoring.png";

export type FeatureItemContent = {
  title: string;
  description: string;
};

export type EnergyMonitoringProps = {
  title?: string;
  features?: FeatureItemContent[];
  /** Side photo masked through the hex cluster. */
  imageSrc?: string;
};

const DEFAULT_FEATURES: FeatureItemContent[] = [
  {
    title: "Live Solar Production Tracking",
    description:
      "Monitor your solar panel energy production in real-time. See exactly how much energy you're generating with instant updates.",
  },
  {
    title: "Weather-Based Forecasts",
    description:
      "Get accurate predictions for your solar energy output based on upcoming weather patterns, helping you plan energy usage effectively.",
  },
  {
    title: "Daily Energy Overview",
    description:
      "View comprehensive daily energy production with visual graphs showing peak generation times and total output.",
  },
];

export default function EnergyMonitoring({
  title = "Real-Time Energy Monitoring",
  features = DEFAULT_FEATURES,
  imageSrc = sideImage.src,
}: EnergyMonitoringProps = {}) {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-28">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={imageSrc}
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
        <div className="z-9">
          <SectionTitle>{title}</SectionTitle>
          <div className="mt-8 space-y-8">
            {features.map((f) => (
              <FeatureItem
                key={f.title}
                title={f.title}
                description={f.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
