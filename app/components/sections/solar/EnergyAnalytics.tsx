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
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 sm:py-20 min-[1200px]:py-45 px-6 lg:px-0">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:gap-10">
        {/* left: uniform 3-hex hive cluster — wrapper holds the absolute
            positioning + explicit width so the inner `w-full` resolves
            against a non-zero containing block */}
        <div className="absolute -left-50 -top-10 hidden w-125.5 min-[1200px]:block">
          <SharedImageHexCluster
            src={clusterSrc}
            viewBox={HIVE_3_VIEWBOX}
            placements={HIVE_3_PLACEMENTS}
            fallbackColor="#3a4a5c"
            className="w-full"
          />
        </div>
        {/* middle: title + features */}
        <div className="min-[1200px]:max-w-111.5 max-[1200px]:max-w-160 flex flex-col justify-center max-[1200px]:items-center">
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
          {/* inline phone for tablet/mobile — side images hidden below 1200px */}
          <div className="w-75 min-[1200px]:hidden mt-10">
            <Image
              src={deviceSrc}
              alt={deviceAlt}
              sizes="(min-width: 1024px) 300px, 280px"
              quality={50}
              className="h-auto w-full"
            />
          </div>
        </div>
        {/* right: analytics phone — wrapper has explicit width, image
            fills it via w-full h-auto so it scales proportionally
            instead of rendering at intrinsic size */}
        <div className="absolute -top-20 right-0 hidden w-75 min-[1200px]:block">
          <Image
            src={deviceSrc}
            alt={deviceAlt}
            sizes="(min-width: 1024px) 300px, 280px"
            quality={50}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
