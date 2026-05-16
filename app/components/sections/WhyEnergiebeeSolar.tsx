import Hexagon from "../ui/Hexagon";
import { FeatureCard, SectionLead, SectionTitle } from "../ui/SectionContent";
import HiveHexCluster from "../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/hero-device.svg";
import windTurbineImg from "@/public/wind-turbine.png";
import Image from "next/image";

export default function WhyEnergiebeeSolar() {
  return (
    <section className="relative overflow-hidden bg-white py-20 pb-10 text-black lg:py-25 lg:pb-12.5 ">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="max-w-163.5 z-9">
          <SectionTitle>Why Choose energiebee Solar?</SectionTitle>
          <SectionLead className="max-w-163.5">
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

        {/* hexagon cluster — same canonical hive shape as the rest of the page */}
        <HiveHexCluster
          className="mx-auto w-full max-w-105 sm:max-w-125 lg:max-w-120"
          left={{ src: windTurbineImg.src, color: "#7FA9C9" }}
          topRight={{ src: beeFlowerImg.src, color: "#D4A017" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="cosy bee app"
                className="absolute left-1/2 top-[12%] w-[65%] -translate-x-1/2"
              />
            ),
          }}
        />
      </div>
    </section>
  );
}
