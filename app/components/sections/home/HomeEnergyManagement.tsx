import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { FeatureCard, SectionTitle } from "../../ui/SectionContent";
import sideImage from "@/public/energy-management.png";
import Hexagon from "../../ui/Hexagon";

/**
 * Home "Energy Management" — dark variant with title + 3 feature cards
 * on the left and a hive cluster on the right.
 */
export default function HomeEnergyManagement() {
  return (
    <section className="relative overflow-hidden py-20 text-white lg:py-25">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className=" flex flex-col max-[1200px]:items-center  z-9">
          <div className="max-w-163.5">
            <SectionTitle>Energy Management</SectionTitle>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#545454]">
              A clear view of how energy is used, timed, and distributed across
              your home.
            </p>
            <div className="mt-8 space-y-4">
              <FeatureCard
                glyph="sun"
                title="Energy Use"
                description={
                  "See where and when energy is used across your home.\n Understand how demand changes throughout the day."
                }
                descClassName="whitespace-pre-line"
              />
              <FeatureCard
                glyph="dollar"
                title="Cost Awareness"
                description={
                  "Understand how usage translates into cost.\nSee how your daily activity affects overall spending."
                }
                descClassName="whitespace-pre-line"
              />
              <FeatureCard
                glyph="chart"
                title="System Behaviour"
                description={
                  "See how your home operates as an energy system.\nUnderstand how usage, availability, and conditions interact."
                }
                descClassName="whitespace-pre-line"
              />
            </div>
          </div>
        </div>

        {/* cluster — right */}
        <SharedImageHexCluster
          src={sideImage.src}
          gap={5}
          fallbackColor="#1a1a1a"
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
        />
      </div>
    </section>
  );
}
