import {
  FeatureCard,
  SectionLead,
  SectionTitle,
} from "@/app/components/ui/SectionContent";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import deviceImg from "@/public/energy/energiebee-app-weekly-energy-spend-graph.png";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

export default function WhyEnergieBee() {
  // Two-column band: title + lead + feature cards on the left, phone mockup on
  // the right.
  return (
    <Section surface="base" spacing="lg">
      <Container
        size="wide"
        className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1.25fr_1fr] min-[1200px]:gap-6"
      >
        {/* text — left */}
        <div className="z-9 flex flex-col justify-center max-[1200px]:mx-auto max-[1200px]:max-w-160 min-[1200px]:max-w-155">
          <SectionTitle align="left">
            Why Choose EnergieBee Energy?
          </SectionTitle>
          <SectionLead>
            Part of the EnergieBee app — one dashboard for every kilowatt-hour,
            every device, every cost.
          </SectionLead>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="See Everything"
              description="Grid, solar, battery, and individual devices — all on one timeline, with the same units and the same clarity."
            />
            <FeatureCard
              glyph="dollar"
              title="Track Savings"
              description="Every automation logged with its hard-dollar impact. Know what's working and what's not."
            />
            <FeatureCard
              glyph="chart"
              title="Smart Analytics"
              description="Trend detection, anomaly alerts, and bill projections — the analytics you'd build if you had the time."
            />
          </div>
        </div>

        {/* phone — right */}
        <div className="mx-auto w-full max-w-82.5">
          <Image
            src={deviceImg}
            alt="energy analytics dashboard"
            sizes="(min-width: 1200px) 330px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>
      </Container>
    </Section>
  );
}
