import Image from "next/image";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import deviceImg from "@/public/homepage-images/energiebee-solar-forecasting.png";
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
        <div className="absolute -top-17 left-0 hidden w-[305.3px] min-[1200px]:block">
          <Image
            src={deviceImg}
            alt="EnergieBee solar dashboard"
            sizes="(min-width: 1024px) 365px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>

        {/* middle: title + feature cards */}
        <div className="min-[1200px]:max-w-113.75 max-[1200px]:max-w-160 flex flex-col justify-center px-6 sm:px-10 lg:px-0">
          <SectionTitle>Solar Forecasting</SectionTitle>
          {/* <p className="mt-3 max-w-xl text-base leading-relaxed max-[1200px]:text-center text-[#545454]">
            A complete view of solar production, weather, and usage across the
            day.
          </p> */}
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Maximise Production"
              description="See how your solar performs day by day."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="See how daily energy habits affect savings."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Insights"
              description="Understand patterns across your home energy."
            />
          </div>
          <div className="w-[335.3px] mx-auto min-[1200px]:hidden mt-4">
            <Image
              src={deviceImg}
              alt="EnergieBee solar dashboard"
              sizes="(min-width: 1024px) 365px, 280px"
              quality={85}
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
            cornerInset={4}
            gap={5}
            fallbackColor="#3a4a5c"
            className="w-full transform-[scaleX(-1)]"
          />
        </div>
      </div>
    </section>
  );
}
