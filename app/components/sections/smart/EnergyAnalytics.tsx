import { FeatureItem, SectionTitle } from "@/app/components/ui/SectionContent";
import deviceImg from "@/public/smart/energiebee-app-weekly-energy-spend-overview.png";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

export default function EnergyAnalytics() {
  // Two-column band: title + features on the left, phone mockup on the right.
  // Stacks text-then-phone below 1200px.
  return (
    <Section surface="base" spacing="lg">
      <Container
        size="wide"
        className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1.25fr_1fr] min-[1200px]:gap-6"
      >
        {/* text — left */}
        <div className="z-9 flex flex-col justify-center max-[1200px]:mx-auto max-[1200px]:max-w-160 min-[1200px]:max-w-111.5">
          <SectionTitle align="left">Energy &amp; Savings</SectionTitle>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
            Understand the impact of your energy choices.
          </p>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureItem
              title="Track Savings"
              description="See how solar generation reduces your energy costs."
            />
            <FeatureItem
              title="Energy Independence"
              description="Understand how much energy comes from solar versus the grid."
            />
            <FeatureItem
              title="Environmental Impact"
              description="Track your carbon savings and environmental contribution."
            />
          </div>
        </div>

        {/* phone — right. Wrapper owns the width; the image fills it via
            w-full h-auto so it scales proportionally. */}
        <div className="mx-auto w-full max-w-75">
          <Image
            src={deviceImg}
            alt="energy analytics dashboard"
            sizes="(min-width: 1200px) 300px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>
      </Container>
    </Section>
  );
}
