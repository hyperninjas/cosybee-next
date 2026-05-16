import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import Hexagon from "../../ui/Hexagon";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-monitoring.png";

/**
 * "Heating Solutions" — same layout as WhyEnergiebeeSolar, with the
 * positions flipped: hive cluster on the left, title + check-glyph
 * feature cards on the right, cream decorative hex bleeding in from
 * the top-right (instead of top-left).
 */
export default function HeatingSolutions() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-25">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -top-10 w-[18rem] sm:-right-36 sm:w-88 lg:w-76.75"
        />

        {/* cluster — left */}
        <SharedImageHexCluster
          src={sideImage.src}
          gap={5}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          fallbackColor="#1a1a1a"
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
        />

        {/* text — right */}
        <div className="max-w-163.5 z-9">
          <SectionTitle>Heating Solutions</SectionTitle>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="check"
              title="Live Solar Production Tracking"
              description="Monitor your solar panel energy production in real-time. See exactly how much energy you're generating with instant updates."
            />
            <FeatureCard
              glyph="check"
              title="Weather-Based Forecasts"
              description="Get accurate predictions for your solar energy output based on upcoming weather patterns, helping you plan energy usage effectively."
            />
            <FeatureCard
              glyph="check"
              title="Daily Energy Overview"
              description="View comprehensive daily energy production with visual graphs showing peak generation times and total output."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
