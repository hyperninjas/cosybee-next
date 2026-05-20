import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionLead, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/why-energieBee.png";
import Image from "next/image";
import deviceImg from "@/public/energy-saving-device.png";

export default function WhyEnergieBee() {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 sm:py-20 lg:py-25 px-6 lg:px-0">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:gap-10">
        {/* left: phone — wrapper has explicit width, image fills it
            via w-full h-auto so it scales proportionally instead of
            rendering at intrinsic size */}
        <div className="absolute -top-7 left-0 hidden w-[345.3px] min-[1200px]:block">
          <Image
            src={deviceImg}
            alt="energy analytics dashboard"
            sizes="(min-width: 1024px) 350px, 280px"
            quality={50}
            className="h-auto w-full"
          />
        </div>

        {/* middle: title + lead + feature cards */}
        <div className="min-[1200px]:max-w-111.5 max-[1200px]:max-w-160 flex flex-col justify-center max-[1200px]:items-center z-9">
          <SectionTitle>Why Choose energiebee Energy?</SectionTitle>
          <SectionLead className="max-[1200px]:text-center">
            Part of the energiebee app — one dashboard for every kilowatt-hour,
            every device, every cost.
          </SectionLead>
          {/* inline phone for tablet/mobile — side images hidden below 1200px */}
          <div className="w-[345.3px] min-[1200px]:hidden mt-8">
            <Image
              src={deviceImg}
              alt="energy analytics dashboard"
              sizes="(min-width: 1024px) 350px, 280px"
              quality={50}
              className="h-auto w-full"
            />
          </div>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="See Everything"
              description="Grid, solar, battery, and individual devices — all on one timeline, with the same units and the same clarity."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="Every automation logged with its hard-dollar impact. Know what's working and what's not."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Analytics"
              description="Trend detection, anomaly alerts, and bill projections — the analytics you'd build if you had the time."
            />
          </div>
        </div>

        {/* right: 3-hex hive cluster (mirrored) — wrapper holds the
            absolute positioning + explicit width so the inner `w-full`
            has a definite reference */}
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
