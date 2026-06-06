import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/why-energieBee.png";
import Image from "next/image";
import deviceImg from "@/public/heating/energiebee-app-heating-energy-flow.png";

export default function SmarterUnderstanding() {
  return (
    <section className="relative overflow-hidden bg-background py-12 sm:py-16 lg:py-20 px-6 lg:px-0">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:gap-10">
        {/* left: phone mockup */}
        <div className="absolute -top-7 left-0 hidden w-[345.3px] min-[1200px]:block">
          <Image
            src={deviceImg}
            alt="energy dashboard"
            sizes="(min-width: 1024px) 350px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>

        {/* middle: title + feature cards */}
        <div className="min-[1200px]:max-w-111.5 max-[1200px]:max-w-160 flex flex-col justify-center max-[1200px]:items-center z-9">
          <SectionTitle>A Smarter Understanding of Your Home</SectionTitle>
          {/* inline phone for tablet/mobile — side images hidden below 1200px */}
          <div className="w-[345.3px] min-[1200px]:hidden mt-8">
            <Image
              src={deviceImg}
              alt="energy dashboard"
              sizes="(min-width: 1024px) 350px, 280px"
              quality={85}
              className="h-auto w-full"
            />
          </div>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Battery Optimisation Insights"
              description="Improve how stored energy is used across your home system."
            />
            <FeatureCard
              glyph="dollar"
              title="Connected Home Signals"
              description="Prepare your home for real-time energy coordination and future smart integrations."
            />
            <FeatureCard
              glyph="chart"
              title="Indoor Air Quality Awareness"
              description="Monitor air quality conditions that affect comfort, health, and energy efficiency."
            />
          </div>
        </div>

        {/* right: 3-hex hive cluster (mirrored) */}
        <div className="absolute -right-40 top-0 hidden w-125.5 min-[1200px]:block">
          <SharedImageHexCluster
            src={sideImage.src}
            viewBox={HIVE_3_VIEWBOX}
            placements={HIVE_3_PLACEMENTS}
            fallbackColor="#3a4a5c"
            className="w-full transform-[scaleX(-1)]"
          />
        </div>
      </div>
    </section>
  );
}
