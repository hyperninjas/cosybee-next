import Hexagon from "@/app/components/ui/Hexagon";
import HiveHexCluster from "@/app/components/ui/HiveHexCluster";
import { FeatureItem, SectionTitle } from "@/app/components/ui/SectionContent";
import beeFlowerImg from "@/public/energy/img-1.png";
import deviceImg from "@/public/energy/device-mockup-energy.png";
import windTurbineImg from "@/public/energy/img-2.png";
import Image from "next/image";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

export default function EnergyMonitoring() {
  return (
    <Section spacing="md" surface="surface" className="text-foreground">
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-2 min-[1200px]:gap-16">
        {/* uniform 3-hex hive cluster */}
        <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5 z-9"
          gap={5}
          cornerInset={4}
          left={{
            src: windTurbineImg,
            alt: "Wind turbines",
            color: "#7FA9C9",
          }}
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
        <div className="z-9 flex flex-col min-[550px]:max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>Whole-Home Monitoring</SectionTitle>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureItem
              title="Live Consumption Tracking"
              description="Real-time view of how much power your home is using, where it's coming from, and where it's going."
              descWidth="w-[80%]"
            />
            <FeatureItem
              title="Per-Device Breakdown"
              description="Pinpoint the energy hogs in your home with AI-powered appliance disaggregation — no extra sensors needed."
            />
            <FeatureItem
              title="Tariff-Aware Forecasting"
              description="See your projected bill at any moment of the day, so there are no end-of-month surprises."
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
