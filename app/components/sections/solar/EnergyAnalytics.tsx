import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-analytics-side.png";
import deviceImg from "@/public/energy-saving-device.png";
import Image, { type StaticImageData } from "next/image";
import type { FeatureItemContent } from "./EnergyMonitoring";

export type EnergyAnalyticsProps = {
  title?: string;
  features?: FeatureItemContent[];
  /** Side photo masked through the hex cluster on the left. */
  clusterSrc?: string;
  /** Phone-mockup image on the right. */
  deviceSrc?: StaticImageData | string;
  deviceAlt?: string;
};

const DEFAULT_FEATURES: FeatureItemContent[] = [
  {
    title: "Savings Calculator",
    description:
      "Track exactly how much money you're saving with solar. See monthly comparisons and cumulative savings over time.",
  },
  {
    title: "Grid Independence Metrics",
    description:
      "Monitor your energy independence level. Understand how much of your power comes from solar vs. the grid.",
  },
  {
    title: "Carbon Footprint Impact",
    description:
      "Visualize your positive environmental impact with CO2 reduction metrics. See how much you're helping the planet.",
  },
];

export default function EnergyAnalytics({
  title = "Energy & Savings Analytics",
  features = DEFAULT_FEATURES,
  clusterSrc = sideImage.src,
  deviceSrc = deviceImg,
  deviceAlt = "energy analytics dashboard",
}: EnergyAnalyticsProps = {}) {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 sm:py-20 lg:py-45">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-10">
        {/* left: uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={clusterSrc}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          fallbackColor="#3a4a5c"
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 absolute -left-50 -top-10 hidden lg:block"
        />
        {/* middle: title + features */}
        <div className="max-w-111.5">
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
        {/* right: analytics phone */}
        <div className="justify-center lg:justify-end absolute right-0 -top-20 max-h-146.5 max-w-75 hidden lg:block">
          <Image src={deviceSrc} alt={deviceAlt} />
        </div>
      </div>
    </section>
  );
}
