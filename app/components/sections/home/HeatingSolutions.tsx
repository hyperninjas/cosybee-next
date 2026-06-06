// import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import Hexagon from "../../ui/Hexagon";
// import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
// import sideImage from "@/public/energy-monitoring.png";
import Image from "next/image";
import HiveHexCluster from "../../ui/HiveHexCluster";
import windTurbineImg from "@/public/wind-turbine.png";
import deviceImg from "@/public/homepage-images/energiebee-device-heating-solutions.png";
import beeFlowerImg from "@/public/bee-flower.png";

/**
 * "Heating Solutions" — same layout as WhyEnergieBeeSolar, with the
 * positions flipped: hive cluster on the left, title + check-glyph
 * feature cards on the right, cream decorative hex bleeding in from
 * the top-right (instead of top-left).
 */
export default function HeatingSolutions() {
  return (
    <section className="relative overflow-hidden bg-surface py-20 text-foreground lg:py-25">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-[1fr_1.25fr] min-[1200px]:gap-6 lg:px-30">
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -top-10 w-[18rem] sm:-right-36 sm:w-88 lg:w-76.75"
        />
        {/* cluster — left */}

        <HiveHexCluster
          className="order-2 min-[1200px]:order-1 mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-130.5"
          gap={5}
          cornerInset={4}
          left={{ src: windTurbineImg.src, color: "#7FA9C9" }}
          topRight={{ src: beeFlowerImg.src, color: "#D4A017" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="EnergieBee app - Heating solutions"
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 220px, 180px"
                quality={85}
                className="absolute left-1/2 top-[12%] w-[58%] -translate-x-1/2"
              />
            ),
          }}
        />
        {/* text — right */}
        <div className="order-1 min-[1200px]:order-2 min-[1200px]:max-w-163.5 md:max-w-153.5 flex flex-col max-[1200px]:mx-auto max-[1200px]:items-center z-9">
          <SectionTitle>Heating Solutions</SectionTitle>
          <div className="mt-8 space-y-4">
            <FeatureCard
              glyph="check"
              title="Live Solar Production Tracking"
              descClassName="whitespace-pre-line"
              description={
                "Track solar production in real time.\n See how sunlight shapes your energy balance."
              }
            />
            <FeatureCard
              glyph="check"
              title="Weather-Based Forecasts"
              descClassName="whitespace-pre-line"
              description={
                "See how weather affects your home energy.\n Plan ahead with clearer visibility."
              }
            />
            <FeatureCard
              glyph="check"
              title="Daily Energy Overview"
              descClassName="whitespace-pre-line"
              description={
                "Understand how energy changes throughout the day.\n See patterns and peak demand."
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
