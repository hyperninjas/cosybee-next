import { FeatureCard, SectionTitle } from "@/app/components/ui/SectionContent";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import deviceImg from "@/public/heating/energiebee-app-heating-energy-flow.png";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import Hexagon from "../../ui/Hexagon";

export default function SmarterUnderstanding() {
  // Two-column band: title + feature cards on the left, phone mockup on the right.
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
        <div className="z-9 flex flex-col justify-center max-[1200px]:mx-auto max-[1200px]:max-w-160 min-[1200px]:max-w-145">
          <SectionTitle align="left">
            A Smarter Understanding of Your Home
          </SectionTitle>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureCard
              glyph="sun"
              title="Battery Optimisation Insights"
              description="Improve how stored energy is used across your home system."
            />
            <FeatureCard
              glyph="dollar"
              title="Connected Home Signals"
              description="Prepare your home for real-time energy coordination and future smart integrations."
            />
            <FeatureCard
              glyph="chart"
              title="Indoor Air Quality Awareness"
              description="Monitor air quality conditions that affect comfort, health, and energy efficiency."
            />
          </div>
        </div>

        {/* phone — right */}
        <div className="mx-auto w-full max-w-78.75">
          <Image
            src={deviceImg}
            alt="energy dashboard"
            sizes="(min-width: 1200px) 315px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>
      </Container>
    </Section>
  );
}
