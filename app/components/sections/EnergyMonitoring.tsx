import { PHOTOS } from "@/app/lib/photos";
import Hexagon from "../ui/Hexagon";
import SharedImageHexCluster from "../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../ui/SectionContent";

export default function EnergyMonitoring() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-28">
      {/* cream decorative hex bleeding from the top-right */}
      <Hexagon
        color="#F1E89F"
        className="pointer-events-none absolute -right-24 -top-16 w-[18rem] sm:-right-20 sm:w-[22rem] lg:w-[26rem]"
      />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16">
        {/* one shared photo, three hex windows */}
        <div className="mx-auto aspect-[480/420] w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px]">
          <SharedImageHexCluster
            src={PHOTOS.phonesDesk}
            viewBox={{ w: 480, h: 420 }}
            placements={[
              { x: 10, y: 0, scale: 2.1 },
              { x: 240, y: 20, scale: 2.1 },
              { x: 130, y: 200, scale: 2.4 },
            ]}
          />
        </div>

        {/* text */}
        <div>
          <SectionTitle>Real-Time Energy Monitoring</SectionTitle>
          <div className="mt-8 space-y-7">
            <FeatureItem
              title="Live Solar Production Tracking"
              description="Monitor your solar panel energy production in real-time. See exactly how much energy you're generating with instant updates."
            />
            <FeatureItem
              title="Weather-Based Forecasts"
              description="Get accurate predictions for your solar energy output based on upcoming weather patterns, helping you plan energy usage effectively."
            />
            <FeatureItem
              title="Daily Energy Overview"
              description="View comprehensive daily energy production with visual graphs showing peak generation times and total output."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
