import Hexagon from "../../ui/Hexagon";
import HiveHexCluster from "../../ui/HiveHexCluster";
import {
  FeatureItem,
  SectionLead,
  SectionTitle,
} from "../../ui/SectionContent";
import windTurbineImg from "@/public/wind-turbine.png";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/heating/energiebee-app-heating-overview.png";
import Image from "next/image";

const PROBLEMS = [
  "energy waste",
  "rising heating costs",
  "unnecessary carbon emissions",
];

export default function WhyChoose() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-28">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* 3-hex hive cluster — three distinct cells */}
        <HiveHexCluster
          gap={5}
          cornerInset={4}
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 z-9"
          left={{ src: windTurbineImg, alt: "Wind turbines", color: "#7FA9C9" }}
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
                alt="energie bee app screen"
                priority
                fetchPriority="high"
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
          <SectionTitle>Why Choose EnergieBee?</SectionTitle>
          <SectionLead className="max-w-163.5 max-[1200px]:text-center">
            Smarter energy. Lower cost. Smaller footprint.
          </SectionLead>
          <p className="mt-4 text-base leading-relaxed text-[#545454] max-[1200px]:text-center">
            EnergieBee is designed to solve three problems at once:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-base text-[#545454] marker:text-[#545454]">
            {PROBLEMS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="mt-4 text-base leading-relaxed text-[#545454] max-[1200px]:text-center">
            By combining forecasting intelligence with real-world energy
            behaviour, we help homes use only what they need — and nothing more.
          </p>
          <div className="mt-8 space-y-8">
            <FeatureItem
              title="Smarter by Design"
              description="Built on predictive models that continuously learn from real household energy patterns."
            />
            <FeatureItem
              title="Built for Real Savings"
              description="Every optimisation is designed to reduce cost, not just display data."
            />
            <FeatureItem
              title="Built for a Greener Future"
              description="Less wasted energy means lower emissions — without changing your comfort or lifestyle."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
