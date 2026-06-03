// import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import Hexagon from "../../ui/Hexagon";
// import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
// import sideImage from "@/public/energy-monitoring.png";
import HiveHexCluster from "../../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/device-snap-ai-insights.png";
import windTurbineImg from "@/public/wind-turbine.png";
import Image from "next/image";
export default function EnergyMonitoring() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-28">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* uniform 3-hex hive cluster */}

        <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 z-9"
          gap={5}
          cornerInset={4}
          left={{
            src: windTurbineImg,
            alt: "Wind turbines",
            color: "#7FA9C9",
          }}
          topRight={{
            src: beeFlowerImg,
            alt: "Bee on a flower",
            color: "#D4A017",
          }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="energie Bee app screen"
                className="absolute left-1/2 top-[12%] w-[59%] -translate-x-1/2"
              />
            ),
          }}
        />
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -top-13.5 w-[18rem] sm:-right-27 sm:w-88 lg:w-76.75"
        />
        {/* text */}
        <div className="z-9 flex flex-col max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>AI-Powered Insights</SectionTitle>
          <div className="mt-8 space-y-8">
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
