import Image from "next/image";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { FeatureCard, SectionTitle } from "@/app/components/ui/SectionContent";
import HiveHexCluster from "@/app/components/ui/HiveHexCluster";
import deviceWeatherImg from "@/public/hex-images/weather-forecasting.png";
import solarWorker from "@/public/hex-images/solar-worker-attaching-solar-panel.avif";
import roofTopSolar from "@/public/hex-images/roof-top-solar-installation.avif";
import Hexagon from "@/app/components/ui/Hexagon";

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
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-right-36 sm:w-88 lg:w-76.75"
        />
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
        {/* cluster — right */}
        <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
          gap={5}
          cornerInset={4}
          left={{
            src: solarWorker,
            color: "#B7C0A8",
            alt: "a worker attaching a solar panel on roof top - image",
          }}
          // Above-the-fold (section right below the hero) → eager-load so it
          // isn't flagged as an un-prioritised LCP image.
          topRight={{
            src: roofTopSolar,
            color: "#D8A9B6",
            priority: true,
            alt: "roof top solar installation - image",
          }}
          bottomRight={{
            color: "#c9dfe9",
            children: (
              <Image
                src={deviceWeatherImg}
                alt="EnergieBee app - solar forecasting preview"
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 220px, 180px"
                quality={85}
                className="absolute left-1/2 top-[12%] w-[58%] -translate-x-1/2"
              />
            ),
          }}
        />
        {/* phone — right. Wrapper owns the width; the image fills it via
            w-full h-auto so it scales proportionally instead of rendering
            at intrinsic size. */}
        {/* <div className="mx-auto w-full max-w-76.5">
          <Image
            src={deviceImg}
            alt="EnergieBee solar dashboard"
            sizes="(min-width: 1200px) 306px, 280px"
            quality={85}
            className="h-auto w-full"
          />
        </div> */}
      </Container>
    </Section>
  );
}
