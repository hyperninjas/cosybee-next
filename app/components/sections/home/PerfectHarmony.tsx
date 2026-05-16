import Image from "next/image";
import HiveHexCluster from "../../ui/HiveHexCluster";
import { CtaButton } from "../../ui/Cta";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import beeFlowerImg from "@/public/bee-flower.png";
import windTurbineImg from "@/public/wind-turbine.png";
import deviceImg from "@/public/hero-device.svg";
import Hexagon from "../../ui/Hexagon";

/**
 * "Everything in perfect harmony" — text + 3 feature items on the left,
 * three-image hive cluster on the right.
 */
export default function PerfectHarmony() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(117.77deg,#F6F9FB_12.42%,#F3F9F5_51.01%,#EFF7FB_73.68%,#F0F0FB_95.76%)] py-20 text-black lg:py-25">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="max-w-163.5 z-9">
          <SectionTitle>Everything in perfect harmony</SectionTitle>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[#545454]">
            A single app that brings together heating, solar, and energy.
            Receive real-time information, monitor changes, and make decisions
            with peace of mind, only when necessary.
          </p>
          <div className="mt-4 space-y-4">
            <FeatureCard
              glyph="pie"
              title="Unified Dashboard"
              description="See heating, solar, and energy data side by side. Spot patterns instantly."
            />
            <FeatureCard
              glyph="connector"
              title="Smart Connections"
              description="Your heating responds to solar production. Energy insights guide your schedule."
            />
            <FeatureCard
              glyph="device"
              title="Simplified Information"
              description="One app for everything. No juggling multiple accounts or interfaces."
            />
          </div>
          <CtaButton href="/try" size="md" className="mt-10">
            Experience the App
          </CtaButton>
        </div>
        {/* cluster — right */}
        <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
          gap={5}
          left={{ src: windTurbineImg.src, color: "#7FA9C9" }}
          topRight={{ src: beeFlowerImg.src, color: "#D4A017" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="energiebee app"
                className="absolute left-1/2 top-[12%] w-[65%] -translate-x-1/2"
              />
            ),
          }}
        />
      </div>
    </section>
  );
}
