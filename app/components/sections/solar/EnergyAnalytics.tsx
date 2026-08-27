import { FeatureItem, SectionTitle } from "@/app/components/ui/SectionContent";
import deviceImg from "@/public/solar/energiebee-app-solar-system-overview.png";
import Image, { type StaticImageData } from "next/image";
import type { FeatureItemContent } from "./EnergyMonitoring";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import Hexagon from "../../ui/Hexagon";

export type EnergyAnalyticsProps = {
  title?: string;
  features?: FeatureItemContent[];
  /** Phone-mockup image on the right. */
  deviceSrc?: StaticImageData | string;
  deviceAlt?: string;
};

const DEFAULT_FEATURES: FeatureItemContent[] = [
  {
    title: "Savings Calculator",
    description:
      "Track exactly how much money you're saving with solar. See monthly comparisons and cumulative savings over time.",
  },
  {
    title: "Grid Independence Metrics",
    description:
      "Monitor your energy independence level. Understand how much of your power comes from solar vs. the grid.",
  },
  {
    title: "Carbon Footprint Impact",
    description:
      "Visualise your positive environmental impact with CO2 reduction metrics. See how much you're helping the planet.",
  },
];

export default function EnergyAnalytics({
  title = "Energy & Savings Analytics",
  features = DEFAULT_FEATURES,
  deviceSrc = deviceImg,
  deviceAlt = "energy analytics dashboard",
}: EnergyAnalyticsProps = {}) {
  // Two-column band: title + features on the left, phone mockup on the right.
  return (
    <Section surface="base" spacing="lg">
      <Container
        size="wide"
        className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1.25fr_1fr] min-[1200px]:gap-6"
      >
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="z-9 flex flex-col justify-center max-[1200px]:mx-auto max-[1200px]:max-w-160 min-[1200px]:max-w-160">
          <SectionTitle align="left">{title}</SectionTitle>
          <div className="mt-6 md:mt-8 space-y-8">
            {features.map((f) => (
              <FeatureItem
                key={f.title}
                title={f.title}
                description={f.description}
                descWidth="md:w-[80%]"
              />
            ))}
          </div>
        </div>

        {/* phone — right */}
        <div className="mx-auto w-full max-w-75">
          <Image
            src={deviceSrc}
            alt={deviceAlt}
            sizes="(min-width: 1200px) 300px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>
      </Container>
    </Section>
  );
}
