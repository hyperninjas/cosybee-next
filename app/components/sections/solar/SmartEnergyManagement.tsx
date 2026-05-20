import Hexagon from "../../ui/Hexagon";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImg from "@/public/energy-management.png";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";

export default function SmartEnergyManagement() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-22.5">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="z-9 flex flex-col max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>Smart Energy Management</SectionTitle>
          <div className="mt-8 space-y-8">
            <FeatureItem
              title="Battery Optimisation"
              description="Get intelligent recommendations on when to store or use your solar energy to maximize savings and reduce grid dependency."
            />
            <FeatureItem
              title="Smart Device Integration"
              description="Connect to your smart home devices and optimize their energy usage based on your solar production patterns."
            />
            <FeatureItem
              title="ROI Tracking"
              description="Track your return on investment with detailed financial calculations. See exactly how long until your solar panels pay for themselves."
            />
          </div>
        </div>

        {/* uniform 3-hex hive cluster */}
        <SharedImageHexCluster
          src={sideImg.src}
          viewBox={HIVE_3_VIEWBOX}
          placements={HIVE_3_PLACEMENTS}
          className="mx-auto w-full max-w-100 sm:max-w-110 lg:max-w-125.5"
        />
      </div>
    </section>
  );
}
