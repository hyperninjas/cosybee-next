import Image from "next/image";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { FeatureCard, SectionTitle } from "@/app/components/ui/SectionContent";
import deviceImg from "@/public/homepage-images/energiebee-solar-forecasting.png";

/**
 * Home "Solar Forecasting" — title + 3 feature cards on the left, phone
 * mockup on the right. Same two-column rhythm as HomeEnergyManagement /
 * HeatingSolutions: one column below 1200px (text first, then the phone),
 * side by side above it.
 */
export default function HomeSolarForecasting() {
  return (
    <Section surface="surface" spacing="lg" className="text-foreground">
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1.25fr_1fr] min-[1200px]:gap-6">
        {/* text — left */}
        <div className="z-9 flex flex-col max-[1200px]:mx-auto max-[1200px]:max-w-160 min-[1200px]:max-w-163.5">
          <SectionTitle align="left">Solar Forecasting</SectionTitle>
          {/* <p className="mt-3 max-w-xl text-base leading-relaxed max-[1200px]:text-center text-[#545454]">
            A complete view of solar production, weather, and usage across the
            day.
          </p> */}
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureCard
              glyph="solar"
              title="Maximise Production"
              description="See how your solar performs day by day."
            />
            <FeatureCard
              glyph="savings"
              title="Track Savings"
              description="See how daily energy habits affect savings."
            />
            <FeatureCard
              glyph="insights"
              title="Smart Insights"
              description="Understand patterns across your home energy."
            />
          </div>
        </div>

        {/* phone — right. Wrapper owns the width; the image fills it via
            w-full h-auto so it scales proportionally instead of rendering
            at intrinsic size. */}
        <div className="mx-auto w-full max-w-76.5">
          <Image
            src={deviceImg}
            alt="EnergieBee solar dashboard"
            sizes="(min-width: 1200px) 306px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div>
      </Container>
    </Section>
  );
}
