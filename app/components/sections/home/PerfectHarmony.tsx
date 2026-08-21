import Image from "next/image";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import HiveHexCluster from "@/app/components/ui/HiveHexCluster";
// import { CtaButton } from "@/app/components/ui/Cta";
import { FeatureCard, SectionTitle } from "@/app/components/ui/SectionContent";
import cottageImg from "@/public/ss-image/ss-small-9.png";
import beeHydrangeaImg from "@/public/ss-image/ss-small-8.png";
import deviceImg from "@/public/homepage-images/energiebee-device-energy.png";
import Hexagon from "@/app/components/ui/Hexagon";

/**
 * "Everything in perfect harmony" — text + 3 feature items on the left,
 * three-image hive cluster on the right.
 */
export default function PerfectHarmony() {
  return (
    <Section
      spacing="lg"
      className="bg-surface text-foreground dark:bg-none dark:bg-background"
    >
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1.25fr_1fr] min-[1200px]:gap-6">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="min-[1200px]:max-w-170.5 flex flex-col min-[550px]:max-[1200px]:items-start z-9">
          <SectionTitle className="whitespace-pre-line">
            {"Everything connected \n in one place"}
          </SectionTitle>
          <p className="mt-4 max-w-lg text-[20px] leading-8 text-muted min-[550px]:max-[1200px]:text-center font-medium">
            A single app to see how your home performs in real conditions and
            understand your energy balance.
          </p>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureCard
              glyph="house"
              descClassName="whitespace-pre-line"
              title="Unified view of your home"
              description="See heating, solar, and energy data side by side. Spot patterns instantly."
            />
            <FeatureCard
              glyph="connect"
              descClassName="whitespace-pre-line"
              title="Smart connections"
              description="Energy insights help your home adapt to changing conditions."
            />
            <FeatureCard
              glyph="phone"
              descClassName="whitespace-pre-line"
              title="Simplified information"
              description="Understand what is happening and why it changes."
            />
          </div>
          {/* <CtaButton href="/try" size="md" className="mt-10 w-fit">
            Experience the App
          </CtaButton> */}
        </div>
        {/* cluster — right */}
        <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
          gap={5}
          cornerInset={4}
          left={{ src: cottageImg, color: "#B7C0A8" }}
          // Above-the-fold (section right below the hero) → eager-load so it
          // isn't flagged as an un-prioritised LCP image.
          topRight={{ src: beeHydrangeaImg, color: "#D8A9B6", priority: true }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="EnergieBee app preview"
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 220px, 180px"
                quality={85}
                className="absolute left-1/2 top-[12%] w-[58%] -translate-x-1/2"
              />
            ),
          }}
        />
      </Container>
    </Section>
  );
}
