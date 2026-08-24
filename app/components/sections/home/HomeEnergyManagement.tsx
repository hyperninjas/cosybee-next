import { FeatureCard, SectionTitle } from "@/app/components/ui/SectionContent";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import Hexagon from "@/app/components/ui/Hexagon";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import HiveHexCluster from "@/app/components/ui/HiveHexCluster";
import deviceImg from "@/public/homepage-images/energiebee-device-energy-management.png";
import energyDisplayImg from "@/public/ss-image/ss-small-11.png";
import gatewayImg from "@/public/ss-image/ss-small-6.png";

/**
 * Home "Energy Management" — dark variant with title + 3 feature cards
 * on the left and a hive cluster on the right.
 */
export default function HomeEnergyManagement() {
  return (
    <Section spacing="lg" surface="base" className="text-white">
      <Container className="grid grid-cols-1 items-center gap-12 min-[1200px]:grid-cols-[1fr_1fr] min-[1200px]:gap-35">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E2"
          className="pointer-events-none absolute -top-10 w-[18rem] sm:-right-28 sm:w-88 lg:w-76.75"
        />
        {/* cluster — right */}
        <HiveHexCluster
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-130.5"
          gap={5}
          cornerInset={4}
          left={{ src: energyDisplayImg, color: "#AEB2B4", alt: "" }}
          topRight={{ src: gatewayImg, color: "#4E6472", alt: "" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="EnergieBee app - Energy management"
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 220px, 180px"
                quality={85}
                className="absolute left-1/2 top-[12%] w-[58%] -translate-x-1/2"
              />
            ),
          }}
        />
        {/* text — left */}
        <div className=" flex flex-col max-[1200px]:items-center  z-9">
          <div className="max-w-163.5">
            <SectionTitle>Energy Management</SectionTitle>
            {/* <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
              A clear view of how energy is used, timed, and distributed across
              your home.
            </p> */}
            <div className="mt-6 md:mt-8 space-y-4">
              <FeatureCard
                glyph="energy"
                title="Energy Use"
                description={"See where and when energy is used."}
                descClassName="whitespace-pre-line"
              />
              <FeatureCard
                glyph="pound"
                title="Cost Awareness"
                description={"Understand how energy patterns affect costs."}
                descClassName="whitespace-pre-line"
              />
              <FeatureCard
                glyph="home"
                title="System Behaviour"
                description={
                  "See how weather, solar and home activity interact."
                }
                descClassName={"whitespace-pre-line"}
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
