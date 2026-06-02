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
    <section className="relative overflow-hidden bg-[#F7F7F7] py-10 text-black min-[1200px]:py-25">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12  lg:gap-10">
        {/* left: phone — wrapper has explicit width, image fills it via
            w-full h-auto so it scales proportionally instead of rendering
            at intrinsic size */}
        <div className="absolute -top-17 left-0 hidden w-[365.3px] min-[1200px]:block">
          <Image
            src={deviceImg}
            alt="EnergieBee solar dashboard"
            sizes="(min-width: 1024px) 365px, 280px"
            quality={50}
            className="h-auto w-full"
          />
        </div>

        {/* middle: title + feature cards */}
        <div className="min-[1200px]:max-w-113.75 max-[1200px]:max-w-160 flex flex-col justify-center max-[1200px]:items-center px-6 sm:px-10 lg:px-0">
          <SectionTitle>Solar Forecasting</SectionTitle>
          <p className="mt-3 max-w-xl text-base leading-relaxed max-[1200px]:text-center text-[#545454]">
            A complete view of solar production, weather, and usage across the
            day.
          </p>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Maximize Production"
              description="Track how your system performs in real time. Identify opportunities to make better use of available energy."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="See how your energy use impacts your savings. Compare daily performance and long-term results."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Analytics"
              description="Access key insights into your system performance. Understand production patterns, independence, and overall impact."
            />
          </div>
          <div className="w-[365.3px] -ml-3 min-[1200px]:hidden mt-4">
            <Image
              src={deviceImg}
              alt="EnergieBee solar dashboard"
              sizes="(min-width: 1024px) 365px, 280px"
              quality={50}
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* right: hive cluster — wrapper holds the absolute positioning
            and an explicit width so the inner `w-full` has something
            non-zero to resolve against */}
        <div className="absolute -right-40 top-0 hidden w-125.5 min-[1200px]:block">
          <SharedImageHexCluster
            src={sideImage.src}
            gap={5}
            fallbackColor="#3a4a5c"
            className="w-full transform-[scaleX(-1)]"
          />
        </div>
      </div>
    </section>
  );
}
