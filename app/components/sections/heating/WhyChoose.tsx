import Hexagon from "@/app/components/ui/Hexagon";
import HiveHexCluster from "@/app/components/ui/HiveHexCluster";
import {
  FeatureItem,
  SectionLead,
  SectionTitle,
} from "@/app/components/ui/SectionContent";
import windTurbineImg from "@/public/wind-turbine.png";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/heating/energiebee-app-heating-overview.png";
import Image from "next/image";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

const PROBLEMS = [
  "energy waste",
  "rising heating costs",
  "unnecessary carbon emissions",
];

export default function WhyChoose() {
  return (
    <Section spacing="md" surface="base" className="text-foreground">
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-2 min-[1200px]:gap-16">
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
        {/* Tablet (550–1200px) keeps the column capped at the desktop width and
            centred on the page, but its content stays left-aligned — a centred
            bullet list and centred feature rows read as ragged here. */}
        <div className="z-9 flex flex-col text-left min-[550px]:max-w-163.5 min-[550px]:max-[1200px]:mx-auto">
          <SectionTitle className="min-[550px]:max-[1200px]:text-left!">
            Why Choose EnergieBee?
          </SectionTitle>
          <SectionLead className="max-w-163.5">
            Smarter energy. Lower cost. Smaller footprint.
          </SectionLead>
          <p className="mt-4 text-base text-muted">
            EnergieBee is designed to solve three problems at once:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-base text-left text-muted marker:text-muted">
            {PROBLEMS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="mt-4 text-base max-w-135 text-muted">
            By combining forecasting intelligence with real-world energy
            behaviour, we help homes use only what they need — and nothing more.
          </p>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureItem
              glyph="insights"
              title="Smarter by Design"
              description="Built on predictive models that continuously learn from real household energy patterns."
            />
            <FeatureItem
              glyph="savings"
              title="Built for Real Savings"
              description="Every optimisation is designed to reduce cost, not just display data."
            />
            <FeatureItem
              glyph="green"
              title="Built for a Greener Future"
              description="Less wasted energy means lower emissions — without changing your comfort or lifestyle."
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
