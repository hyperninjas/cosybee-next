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
              description={
                "Track your solar generation in real time.\n See how production changes throughout the day."
              }
            />
            <FeatureCard
              glyph="check"
              title="Weather-Based Forecasts"
              description={
                "Know what to expect from upcoming weather.\n Adjust your energy use based on changing conditions."
              }
            />
            <FeatureCard
              glyph="check"
              title="Daily Energy Overview"
              description={
                "View your energy activity across the day.\n Understand when production increases and demand peaks."
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
