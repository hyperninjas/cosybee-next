import Hexagon from "../../ui/Hexagon";
import {
  FeatureCard,
  SectionLead,
  SectionTitle,
} from "../../ui/SectionContent";
import HiveHexCluster from "../../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/smart/energiebee-app-optimisation.png";
import windTurbineImg from "@/public/wind-turbine.png";
import Image from "next/image";

export default function WhyEnergieBeeSolar() {
  return (
    <section className="relative overflow-hidden bg-white py-12 pb-8 text-black lg:py-12 lg:pb-10">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="min-[1200px]:max-w-163.5 flex flex-col min-[550px]:max-[1200px]:items-center z-9">
          <SectionTitle>Automated Optimisation</SectionTitle>
          <SectionLead className="max-w-163.5 min-[550px]:max-[1200px]:text-center">
            Part of the energiebee app - everything you need to monitor and
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

        {/* hexagon cluster — same canonical hive shape as the rest of the page */}
        <HiveHexCluster
          cornerInset={4}
          className="mx-auto w-full max-w-105 sm:max-w-125 lg:max-w-120"
          left={{ src: windTurbineImg.src, color: "#7FA9C9" }}
          topRight={{ src: beeFlowerImg.src, color: "#D4A017" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="cosy bee app"
                className="absolute left-1/2 top-[12%] w-[68%] -translate-x-1/2"
              />
            ),
          }}
        />
      </div>
    </section>
  );
}
