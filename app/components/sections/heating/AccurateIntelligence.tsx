import Hexagon from "@/app/components/ui/Hexagon";
import SharedImageHexCluster from "@/app/components/ui/SharedImageHexCluster";
import { FeatureItem, SectionTitle } from "@/app/components/ui/SectionContent";
import sideImage from "@/public/heating/energiebee-app-heating-device-mockup.webp";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

export default function AccurateIntelligence() {
  return (
    <Section spacing="md" surface="surface" className="text-foreground">
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-2 min-[1200px]:gap-16">
        {/* uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={sideImage}
          gap={5}
          cornerInset={4}
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 z-9"
        />
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -top-13.5 w-[18rem] sm:-right-27 sm:w-88 lg:w-76.75"
        />
        {/* text */}
        <div className="z-9 flex flex-col min-[550px]:max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>
            Accurate Intelligence for a Smarter, Greener Home
          </SectionTitle>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureItem
              title="High-Accuracy Energy Forecasting"
              description="Our models analyse real-time usage, system behaviour, and external conditions to predict heating demand with high precision."
            />
            <FeatureItem
              title="Climate-Aware Intelligence"
              description="We integrate live weather and environmental data to continuously adapt energy predictions and reduce wasted heating cycles."
            />
            <FeatureItem
              title="Efficiency-First System Design"
              description="Every insight is built to reduce unnecessary energy consumption — helping you save money while lowering your carbon footprint."
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
