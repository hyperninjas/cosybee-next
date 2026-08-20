import { FeatureItem, SectionTitle } from "@/app/components/ui/SectionContent";
import deviceImg from "@/public/heating/energiebee-app-heating-system-overview.png";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

export default function UnderstandOptimise() {
  // Two-column band: title + features on the left, phone mockup on the right.
  return (
    <Section surface="base" spacing="lg">
      <Container
        size="wide"
        className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1.25fr_1fr] min-[1200px]:gap-6"
      >
        {/* text — left */}
        <div className="z-9 flex flex-col justify-center max-[1200px]:mx-auto max-[1200px]:max-w-160 min-[1200px]:max-w-120.5">
          <SectionTitle align="left">
            Understand and Optimise Your Home Energy Today
          </SectionTitle>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureItem
              title="Real-Time Energy Forecasting"
              description="Predict heating demand using live usage patterns and system behaviour."
            />
            <FeatureItem
              title="Weather-Adaptive Insights"
              description="Adjust energy expectations based on local climate conditions."
            />
            <FeatureItem
              title="Daily Energy Overview"
              description="A simple breakdown of energy usage, efficiency, and production every day."
            />
          </div>
        </div>

        {/* phone — right */}
        <div className="mx-auto w-full max-w-75">
          <Image
            src={deviceImg}
            alt="energy dashboard"
            sizes="(min-width: 1200px) 300px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>
      </Container>
    </Section>
  );
}
