import Image from "next/image";
import HiveHexCluster from "../../ui/HiveHexCluster";
import { CtaButton } from "../../ui/Cta";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import beeFlowerImg from "@/public/bee-flower.png";
import windTurbineImg from "@/public/wind-turbine.png";
import deviceImg from "@/public/homepage-images/energiebee-device-energy.png";
import Hexagon from "../../ui/Hexagon";

/**
 * "Everything in perfect harmony" — text + 3 feature items on the left,
 * three-image hive cluster on the right.
 */
export default function PerfectHarmony() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(117.77deg,#F6F9FB_12.42%,#F3F9F5_51.01%,#EFF7FB_73.68%,#F0F0FB_95.76%)] py-20 text-black lg:py-25">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-[1.25fr_1fr] min-[1200px]:gap-6 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="min-[1200px]:max-w-170.5 flex flex-col max-[1200px]:items-center z-9">
          <SectionTitle>Everything connected in one place</SectionTitle>
          <p className="mt-3 max-w-xl text-base max-[1200px]:text-center leading-relaxed text-[#545454]">
            A single app to see how your home performs in real conditions and
            understand your energy balance.
          </p>
          <div className="mt-4 space-y-4">
            <FeatureCard
              glyph="pie"
              descClassName="whitespace-pre-line"
              title="Unified view of your home"
              description="See heating, solar, and energy data side by side. Spot patterns instantly."
            />
            <FeatureCard
              glyph="connector"
              descClassName="whitespace-pre-line"
              title="Smart Connections"
              description="Energy insights help your home adapt to changing conditions."
            />
            <FeatureCard
              glyph="device"
              descClassName="whitespace-pre-line"
              title="Simplified Information"
              description="Understand what is happening and why it changes."
            />
          </div>
          <CtaButton href="/try" size="md" className="mt-10 w-fit">
            Experience the App
          </CtaButton>
        </div>
        {/* cluster — right */}
        <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
          gap={5}
          cornerInset={4}
          left={{ src: windTurbineImg.src, color: "#7FA9C9" }}
          topRight={{ src: beeFlowerImg.src, color: "#D4A017" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="EnergieBee app preview"
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 220px, 180px"
                quality={85}
                className="absolute left-1/2 top-[12%] w-[58%] -translate-x-1/2"
              />
            ),
          }}
        />
      </div>
    </section>
  );
}
