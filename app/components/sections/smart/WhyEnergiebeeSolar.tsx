import Hexagon from "../../ui/Hexagon";
import { FeatureCard, SectionLead, SectionTitle } from "../../ui/SectionContent";
import HiveHexCluster from "../../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/hero-device.svg";
import windTurbineImg from "@/public/wind-turbine.png";
import Image from "next/image";

export default function WhyEnergiebeeSolar() {
  return (
    <section className="relative overflow-hidden bg-white py-20 pb-10 text-black lg:py-25 lg:pb-12.5 ">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="min-[1200px]:max-w-163.5 flex flex-col max-[1200px]:items-center z-9">
          <SectionTitle>Automated Optimisation</SectionTitle>
          <SectionLead className="max-w-163.5 max-[1200px]:text-center">
            Set it once and watch your home optimize itself around your
            routines, the weather, and your electricity prices — automatically.
          </SectionLead>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Adaptive Routines"
              description="Schedules learn from your daily patterns and adjust themselves — no need to fiddle with timers."
            />
            <FeatureCard
              glyph="dollar"
              title="Tariff-Aware Charging"
              description="Devices automatically charge and run when rates are lowest, cutting your bill without sacrificing comfort."
            />
            <FeatureCard
              glyph="chart"
              title="Weather-Driven Tweaks"
              description="The system adjusts heating, cooling, and storage based on the next 24 hours of forecast data."
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
