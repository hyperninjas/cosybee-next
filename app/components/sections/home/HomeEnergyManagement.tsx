import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import Hexagon from "../../ui/Hexagon";
import Image from "next/image";
import HiveHexCluster from "../../ui/HiveHexCluster";
import windTurbineImg from "@/public/wind-turbine.png";
import deviceImg from "@/public/homepage-images/energiebee-device-energy-management.png";
import beeFlowerImg from "@/public/bee-flower.png";

/**
 * Home "Energy Management" — dark variant with title + 3 feature cards
 * on the left and a hive cluster on the right.
 */
export default function HomeEnergyManagement() {
  return (
    <section className="relative overflow-hidden py-20 text-white lg:py-25">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-[1.25fr_1fr] min-[1200px]:gap-6 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className=" flex flex-col max-[1200px]:items-center  z-9">
          <div className="max-w-163.5">
            <SectionTitle>Energy Management</SectionTitle>
            {/* <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
              A clear view of how energy is used, timed, and distributed across
              your home.
            </p> */}
            <div className="mt-8 space-y-4">
              <FeatureCard
                glyph="sun"
                title="Energy Use"
                description={"See where and when energy is used."}
                descClassName="whitespace-pre-line"
              />
              <FeatureCard
                glyph="dollar"
                title="Cost Awareness"
                description={"Understand how energy patterns affect costs."}
                descClassName="whitespace-pre-line"
              />
              <FeatureCard
                glyph="chart"
                title="System Behaviour"
                description={
                  "See how weather, solar and home activity interact."
                }
                descClassName={"whitespace-pre-line"}
              />
            </div>
          </div>
        </div>

        {/* cluster — right */}
        <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-130.5"
          gap={5}
          cornerInset={4}
          left={{ src: windTurbineImg.src, color: "#7FA9C9", alt: "" }}
          topRight={{ src: beeFlowerImg.src, color: "#D4A017", alt: "" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="EnergieBee app - Energy management"
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
