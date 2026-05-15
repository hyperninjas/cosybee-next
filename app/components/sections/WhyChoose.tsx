import { PHOTOS } from "@/app/lib/photos";
import AnalyticsPhone from "../mockups/AnalyticsPhone";
import SharedImageHexCluster from "../ui/SharedImageHexCluster";
import {
  FeatureCard,
  SectionLead,
  SectionTitle,
} from "../ui/SectionContent";

export default function WhyChoose() {
  return (
    <section className="relative overflow-hidden bg-neutral-50 py-16 sm:py-20 lg:py-24">
      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-10 lg:px-12">
        {/* left: phone */}
        <div className="flex justify-center lg:justify-start">
          <AnalyticsPhone className="w-[260px] sm:w-[280px] lg:w-[290px]" />
        </div>

        {/* middle: title + lead + cards */}
        <div>
          <SectionTitle>Why Choose energiebee Solar?</SectionTitle>
          <SectionLead>
            Part of the energiebee app — everything you need to monitor and
            optimize your solar energy system.
          </SectionLead>
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

        {/* right: shared-image hex cluster */}
        <div className="mx-auto aspect-420/540 w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[340px]">
          <SharedImageHexCluster
            src={PHOTOS.installer}
            viewBox={{ w: 420, h: 540 }}
            placements={[
              { x: 60, y: 0, scale: 1.7 },
              { x: 20, y: 230, scale: 2.1 },
              { x: 280, y: 310, scale: 1.5 },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
