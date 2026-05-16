import Hexagon from "../../ui/Hexagon";
import { FeatureItem, SectionTitle } from "../../ui/SectionContent";
import sideImg from "@/public/energy-management.png";
import SharedImageHexCluster from "../../ui/SharedImageHexCluster";
import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";

export default function SmartEnergyManagement() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-22.5">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="z-9">
          <SectionTitle>Smart Home Integration</SectionTitle>
          <div className="mt-8 space-y-8">
            <FeatureItem
              title="One-Tap Device Control"
              description="Manage every smart light, thermostat, and outlet from a single interface — designed for daily use, not menus."
            />
            <FeatureItem
              title="Voice Assistant Ready"
              description="Works seamlessly with Alexa, Google Assistant, and Apple HomeKit out of the box. No bridges or adapters needed."
            />
            <FeatureItem
              title="Custom Automations"
              description="Build if-this-then-that rules for your home in minutes. No coding, no scripts — just clear, visual triggers."
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
