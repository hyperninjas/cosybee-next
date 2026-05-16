import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-management.png";
import Hexagon from "../../ui/Hexagon";

/**
 * Home "Energy Management" — dark variant with title + 3 feature cards
 * on the left and a hive cluster on the right.
 */
export default function HomeEnergyManagement() {
  return (
    <section className="relative overflow-hidden py-20 text-white lg:py-25">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="max-w-163.5 z-9">
          <SectionTitle className="">Energy Management</SectionTitle>
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

        {/* cluster — right */}
        <SharedImageHexCluster
          src={sideImage.src}
          gap={5}
          fallbackColor="#1a1a1a"
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
        />
      </div>
    </section>
  );
}
