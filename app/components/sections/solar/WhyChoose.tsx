import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import { PHOTOS } from "@/app/lib/photos";
import AnalyticsPhone from "../../mockups/AnalyticsPhone";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import {
  FeatureCard,
  SectionLead,
  SectionTitle,
} from "../../ui/SectionContent";

export default function WhyChoose() {
  return (
    <section className="relative overflow-hidden bg-neutral-50 py-12 sm:py-16 lg:py-20">
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-10 lg:px-12">
        {/* left: phone */}
        <div className="flex justify-center lg:justify-start">
          <AnalyticsPhone className="w-[260px] sm:w-[280px] lg:w-[290px]" />
        </div>

        {/* middle: title + lead + cards */}
        <div>
          <SectionTitle>Why Choose EnergieBee Solar?</SectionTitle>
          <SectionLead>
            Part of the EnergieBee app — everything you need to monitor and
            optimise your solar energy system.
          </SectionLead>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Maximise Production"
              description="Track real-time solar generation and get insights to optimise energy production."
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

        {/* right: uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={PHOTOS.installer}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          className="mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[380px]"
        />
      </div>
    </section>
  );
}
