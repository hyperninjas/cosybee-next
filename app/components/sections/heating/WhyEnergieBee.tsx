import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionLead, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/why-energieBee.png";
import Image from "next/image";
import deviceImg from "@/public/energy-saving-device.png";

export default function WhyEnergieBee() {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 sm:py-20 lg:py-25 px-6 lg:px-0">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-10">
        {/* left: phone — wrapper has explicit width, image fills it
            via w-full h-auto so it scales proportionally instead of
            rendering at intrinsic size */}
        <div className="absolute -top-7 left-0 hidden w-[345.3px] lg:block">
          <Image
            src={deviceImg}
            alt="energy analytics dashboard"
            sizes="(min-width: 1024px) 350px, 280px"
            quality={50}
            className="h-auto w-full"
          />
        </div>

        {/* middle: title + lead + feature cards */}
        <div className="max-w-111.5 z-9">
          <SectionTitle>Why Choose energiebee Heating?</SectionTitle>
          <SectionLead>
            Part of the energiebee app — everything you need to monitor,
            control, and optimize your home heating.
          </SectionLead>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Maximize Comfort"
              description="Hit your ideal temperature in every room, every hour of the day — without thinking about it."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="See exactly how much money smarter heating saves you, with monthly and year-over-year comparisons."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Analytics"
              description="Detailed insights on runtime, gas usage, and per-room efficiency — find the wins."
            />
          </div>
        </div>

        {/* right: 3-hex hive cluster (mirrored) — wrapper holds the
            absolute positioning + explicit width so the inner `w-full`
            has a definite reference */}
        <div className="absolute -right-40 top-0 hidden w-125.5 lg:block">
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
