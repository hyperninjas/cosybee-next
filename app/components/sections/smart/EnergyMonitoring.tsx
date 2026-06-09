// import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import Hexagon from "../../ui/Hexagon";
// import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
// import sideImage from "@/public/energy-monitoring.png";
import HiveHexCluster from "../../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/smart/energiebee-app-home-heating-spend-graph.png";
import windTurbineImg from "@/public/wind-turbine.png";
import Image from "next/image";
export default function EnergyMonitoring() {
  return (
    <section className="relative overflow-hidden bg-white py-12 text-black lg:py-16">
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
        <div className="z-9 flex flex-col min-[550px]:max-[1200px]:items-center! min-[1200px]:max-w-163.5">
          <SectionTitle>AI-Powered Insights</SectionTitle>
          <p className="mt-3 max-w-xl text-base min-[550px]:max-[1200px]:text-center leading-relaxed text-[#545454]">
            See what&apos;s happening across your home energy system.
          </p>
          <div className="mt-6 md:mt-8 space-y-8">
            <FeatureItem
              title="Live Solar Tracking"
              description="Monitor solar production in real time."
            />
            <FeatureItem
              title="Weather-Based Forecasts"
              description="Plan ahead with forecasts based on local weather conditions."
            />
            <FeatureItem
              title="Daily Energy Overview"
              description="Understand production patterns and daily performance."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
