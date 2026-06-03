import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import {
  FeatureCard,
  GlyphName,
  SectionLead,
  SectionTitle,
} from "../../ui/SectionContent";
import sideImage from "@/public/why-energieBee.png";
import Image, { type StaticImageData } from "next/image";
import deviceImg from "@/public/energy-saving-device.png";

export type FeatureCardContent = {
  glyph: GlyphName;
  title: string;
  description: string;
};

export type WhyEnergieBeeProps = {
  title?: string;
  lead?: string;
  cards?: FeatureCardContent[];
  /** Cluster photo on the right (mirrored). */
  clusterSrc?: string;
  /** Phone-mockup image on the left. */
  deviceSrc?: StaticImageData | string;
  deviceAlt?: string;
};

const DEFAULT_CARDS: FeatureCardContent[] = [
  {
    glyph: "sun",
    title: "Maximize Production",
    description:
      "Track real-time solar generation and get insights to optimize energy production.",
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

export default function WhyEnergieBee({
  title = "Why Choose EnergieBee Solar?",
  lead = "Part of the EnergieBee app — everything you need to monitor and optimize your solar energy system.",
  cards = DEFAULT_CARDS,
  clusterSrc = sideImage.src,
  deviceSrc = deviceImg,
  deviceAlt = "energy analytics dashboard",
}: WhyEnergieBeeProps = {}) {
  return (
    <section className="relative overflow-hidden bg-[#F7F7F7] py-16 sm:py-20 lg:py-25 px-6 lg:px-0">
      <div className="relative mx-auto flex flex-col max-w-7xl grid-cols-1 items-center gap-12 lg:gap-10">
        {/* left: phone (absolute, bleeds into the section) — wrapper
            has explicit width, image fills it via w-full h-auto so it
            scales proportionally instead of rendering at intrinsic size */}
        <div className="absolute -top-7 left-0 hidden w-[345.3px] min-[1200px]:block">
          <Image
            src={deviceSrc}
            alt={deviceAlt}
            sizes="(min-width: 1024px) 350px, 280px"
            quality={100}
            className="h-auto w-full"
          />
        </div>

        {/* middle: title + lead + feature cards */}
        <div className="min-[1200px]:max-w-111.5 max-[1200px]:max-w-160 flex flex-col justify-center max-[1200px]:items-center z-9">
          <SectionTitle>{title}</SectionTitle>
          <SectionLead className="max-[1200px]:text-center">{lead}</SectionLead>
          {/* inline phone for tablet/mobile — side images hidden below 1200px */}
          <div className="w-[345.3px] min-[1200px]:hidden mt-8">
            <Image
              src={deviceSrc}
              alt={deviceAlt}
              sizes="(min-width: 1024px) 350px, 280px"
              quality={100}
              className="h-auto w-full"
            />
          </div>
          <div className="mt-8 space-y-4">
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

        {/* right: 3-hex hive cluster (mirrored, installer photo) —
            wrapper holds the absolute positioning + explicit width so
            the inner `w-full` has a definite reference */}
        <div className="absolute -right-40 top-0 hidden w-125.5 min-[1200px]:block">
          <SharedImageHexCluster
            src={clusterSrc}
            viewBox={HIVE_3_VIEWBOX}
            placements={HIVE_3_PLACEMENTS}
            fallbackColor="#3a4a5c"
            className="w-full transform-[scaleX(-1)]"
          />
        </div>
      </div>
    </section>
  );
}
