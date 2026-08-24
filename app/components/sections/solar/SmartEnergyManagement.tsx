import Hexagon from "@/app/components/ui/Hexagon";
import { FeatureItem, SectionTitle } from "@/app/components/ui/SectionContent";
import sideImg from "@/public/energy-management.png";
import SharedImageHexCluster from "@/app/components/ui/SharedImageHexCluster";
import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";

export default function SmartEnergyManagement() {
  return (
    <Section surface="surface" spacing="md" className="text-foreground">
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1fr_1.25fr] min-[1200px]:gap-16">
        {/* uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={sideImg.src}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
        />
        {/* cream decorative hex bleeding from the top-right */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -top-10 w-[18rem] sm:-right-36 sm:w-88 lg:w-76.75"
        />
        {/* text — right */}
        <div className="z-9 flex flex-col min-[550px]:max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>Smart Energy Management</SectionTitle>
          <div className="mt-6 md:mt-8 space-y-4">
            <FeatureItem
              title="Battery Optimisation"
              description="Get intelligent recommendations on when to store or use your solar energy to maximise savings and reduce grid dependency."
              descWidth="w-[85%]"
            />
            <FeatureItem
              title="Smart Device Integration"
              description="Connect to your smart home devices and optimise their energy usage based on your solar production patterns."
              descWidth="w-[85%]"
            />
            <FeatureItem
              title="ROI Tracking"
              description="Track your return on investment with detailed financial calculations. See exactly how long until your solar panels pay for themselves."
              descWidth="w-[90%]"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
