import Image from "next/image";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import deviceImg from "@/public/energy-saving-device.png";
import sideImage from "@/public/energy-analytics-side.png";

/**
 * Home "Solar Forecasting" — phone on the left, title + 3 feature cards
 * in the middle, hive cluster on the right.
 */
export default function HomeSolarForecasting() {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-20 text-black lg:py-25">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-10">
        {/* left: phone */}
        <div className="hidden lg:block absolute left-0 -top-17 max-w-[365.3px]">
          <Image src={deviceImg} alt="energiebee solar dashboard" />
        </div>

        {/* middle: title + feature cards */}
        <div className="max-w-113.75 px-6 sm:px-10 lg:px-0">
          <SectionTitle>Solar Forecasting</SectionTitle>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[#545454]">
            Part of the energiebee app — everything you need to monitor and
            optimize your solar energy system.
          </p>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Maximize Production"
              description="Track real-time solar generation and get insights to optimize energy production."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="See exactly how much money you're saving with detailed analytics and historical comparisons."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Analytics"
              description="Get detailed insights on production patterns, grid independence, and environmental impact."
            />
          </div>
        </div>

        {/* right: hive cluster */}
        <SharedImageHexCluster
          src={sideImage.src}
          gap={5}
          fallbackColor="#3a4a5c"
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 absolute -right-40 top-0 transform-[scaleX(-1)] hidden lg:block"
        />
      </div>
    </section>
  );
}
