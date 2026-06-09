import Hexagon from "../../ui/Hexagon";
import {
  FeatureCard,
  SectionLead,
  SectionTitle,
} from "../../ui/SectionContent";
import HiveHexCluster, { HexCell } from "../../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/solar/energiebee-app-solar-cycle.png";
import windTurbineImg from "@/public/wind-turbine.png";
import Image from "next/image";
import type { FeatureCardContent } from "./WhyEnergieBee";

export type WhyEnergieBeeSolarProps = {
  title?: string;
  lead?: string;
  cards?: FeatureCardContent[];
  /** Hive cluster cells — override individual hexes to swap imagery. */
  left?: HexCell;
  topRight?: HexCell;
  bottomRight?: HexCell;
};

const DEFAULT_CARDS: FeatureCardContent[] = [
  {
    glyph: "sun",
    title: "Maximise Production",
    description:
      "Track real-time solar generation and get insights to optimise energy production.",
  },
  {
    glyph: "dollar",
    title: "Track Savings",
    description:
      "See exactly how much money you're saving with detailed analytics and historical comparisons.",
  },
  {
    glyph: "chart",
    title: "Smart Analytics",
    description:
      "Get detailed insights on production patterns, grid independence, and environmental impact.",
  },
];

const DEFAULT_LEFT: HexCell = {
  src: windTurbineImg.src,
  color: "#7FA9C9",
};

const DEFAULT_TOP_RIGHT: HexCell = {
  src: beeFlowerImg.src,
  color: "#D4A017",
};

const DEFAULT_BOTTOM_RIGHT: HexCell = {
  color: "#E9E19E",
  children: (
    <Image
      src={deviceImg}
      alt="cosy bee app"
      className="absolute left-1/2 top-[16.8%] w-[65%] -translate-x-1/2"
    />
  ),
};

export default function WhyEnergieBeeSolar({
  title = "Why Choose EnergieBee Solar?",
  lead = "Part of the EnergieBee app — everything you need to monitor and optimise your solar energy system.",
  cards = DEFAULT_CARDS,
  left = DEFAULT_LEFT,
  topRight = DEFAULT_TOP_RIGHT,
  bottomRight = DEFAULT_BOTTOM_RIGHT,
}: WhyEnergieBeeSolarProps = {}) {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 pb-8 text-black lg:py-20 lg:pb-10">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="min-[1200px]:max-w-163.5 flex flex-col max-[1200px]:items-center z-9">
          <SectionTitle>{title}</SectionTitle>
          <SectionLead className="max-w-163.5 max-[1200px]:text-center">
            {lead}
          </SectionLead>
          <div className="mt-6 md:mt-8 space-y-4">
            {cards.map((c) => (
              <FeatureCard
                key={c.title}
                glyph={c.glyph}
                title={c.title}
                description={c.description}
              />
            ))}
          </div>
        </div>

        {/* hexagon cluster — same canonical hive shape as the rest of the page */}
        <HiveHexCluster
          className="mx-auto w-full max-w-105 sm:max-w-125 lg:max-w-120"
          left={left}
          topRight={topRight}
          bottomRight={bottomRight}
        />
      </div>
    </section>
  );
}
