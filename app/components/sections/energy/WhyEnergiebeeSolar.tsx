import Hexagon from "../../ui/Hexagon";
import {
  FeatureCard,
  SectionLead,
  SectionTitle,
} from "../../ui/SectionContent";
import HiveHexCluster from "../../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/energy/energiebee-app-live-solar-energy-flow.png";
import windTurbineImg from "@/public/wind-turbine.png";
import Image from "next/image";

export default function WhyEnergieBeeSolar() {
  return (
    <section className="relative overflow-hidden bg-white py-16 pb-8 text-black lg:py-20 lg:pb-10">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="min-[1200px]:max-w-163.5 flex flex-col max-[1200px]:items-center z-9">
          <SectionTitle>Battery + Solar Ready</SectionTitle>
          <SectionLead className="max-w-163.5 max-[1200px]:text-center">
            EnergieBee orchestrates your full energy stack — solar generation,
            battery storage, EV charging, and grid imports — to minimise cost at
            every hour.
          </SectionLead>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Smart Charging"
              description="Batteries and EVs charge from solar surplus first, off-peak grid second. The right power, the right time."
            />
            <FeatureCard
              glyph="dollar"
              title="Grid Export Optimisation"
              description="Sell to the grid when prices are high, store when they're low. Maximise export value automatically."
            />
            <FeatureCard
              glyph="chart"
              title="Outage-Aware"
              description="When the grid drops, batteries take over critical loads automatically — fridge, lights, internet stay on."
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
                className="absolute left-1/2 top-[15.8%] w-[65%] -translate-x-1/2"
              />
            ),
          }}
        />
      </div>
    </section>
  );
}
