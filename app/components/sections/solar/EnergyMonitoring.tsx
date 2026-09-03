import Hexagon from "@/app/components/ui/Hexagon";
import {
  FeatureItem,
  type GlyphName,
  SectionTitle,
} from "@/app/components/ui/SectionContent";
import HiveHexCluster from "@/app/components/ui/HiveHexCluster";
import deviceImg from "@/public/solar/energiebee-app-solar-energy-flow.png";
import featureImage from "@/public/solar/Real-Time-Energy-Monitoring.png";
import energyDisplayImg from "@/public/ss-image/ss-small-11.png";
import smartSwitchImg from "@/public/ss-image/ss-small-1.png";
import Image, { StaticImageData } from "next/image";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

export type FeatureItemContent = {
  /** Hex badge glyph; falls back to the check mark when omitted. */
  glyph?: GlyphName;
  title: string;
  description: string;
};

export type EnergyMonitoringProps = {
  title?: string;
  features?: FeatureItemContent[];
  /** Side photo masked through the hex cluster. */
  imageSrc?: StaticImageData;
};

const DEFAULT_FEATURES: FeatureItemContent[] = [
  {
    glyph: "solar",
    title: "Live Solar Production Tracking",
    description:
      "Monitor your solar panel energy production in real-time. See exactly how much energy you're generating with instant updates.",
  },
  {
    glyph: "weather",
    title: "Weather-Based Forecasts",
    description:
      "Get accurate predictions for your solar energy output based on upcoming weather patterns, helping you plan energy usage effectively.",
  },
  {
    glyph: "energy",
    title: "Daily Energy Overview",
    description:
      "View comprehensive daily energy production with visual graphs showing peak generation times and total output.",
  },
];

export default function EnergyMonitoring({
  title = "Real-Time Energy Monitoring",
  features = DEFAULT_FEATURES,
  imageSrc = deviceImg,
}: EnergyMonitoringProps = {}) {
  return (
    <Section surface="surface" spacing="md" className="text-foreground">
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1fr_1.25fr] min-[1200px]:gap-32">
        {/* uniform 3-hex hive cluster */}

        {/* <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 z-9"
          gap={5}
          cornerInset={4}
          left={{
            src: energyDisplayImg,
            alt: "EnergieBee desktop display showing live energy stats",
            color: "#AEB2B4",
          }}
          topRight={{
            src: smartSwitchImg,
            alt: "Smart switch on a wall",
            color: "#E9EAEC",
          }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={imageSrc}
                alt="energie bee app screen"
                className="absolute left-1/2 top-[12%] w-[59%] -translate-x-1/2"
              />
            ),
          }}
        /> */}
        <Image
          src={featureImage}
          alt="energie bee app screen"
          sizes="(min-width: 1440px) 1440px, 100vw"
          quality={100}
          className="object-cover object-right"
        />
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -top-13.5 w-[18rem] sm:-right-27 sm:w-88 lg:w-76.75"
        />
        {/* text */}
        <div className="z-9 flex flex-col min-[550px]:max-[1200px]:items-center min-[1200px]:max-w-165">
          <SectionTitle>{title}</SectionTitle>
          <div className="mt-6 md:mt-8 space-y-8">
            {features.map((f) => (
              <FeatureItem
                key={f.title}
                glyph={f.glyph}
                title={f.title}
                description={f.description}
                descWidth="w-full"
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
