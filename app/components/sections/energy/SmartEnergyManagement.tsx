import Hexagon from "@/app/components/ui/Hexagon";
import { FeatureItem, SectionTitle } from "@/app/components/ui/SectionContent";
import sideImg from "@/public/energy-management.png";
import SharedImageHexCluster from "@/app/components/ui/SharedImageHexCluster";
import { HIVE_3_PLACEMENTS, HIVE_3_VIEWBOX } from "@/app/lib/hex";

export default function SmartEnergyManagement() {
  return (
    <section className="relative overflow-hidden bg-surface py-16 text-foreground lg:py-16">
      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 sm:px-10 min-[1200px]:grid-cols-2 min-[1200px]:gap-16 lg:px-30">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-36 sm:w-88 lg:w-76.75"
        />
        {/* text — left */}
        <div className="z-9 flex flex-col min-[550px]:max-[1200px]:items-center min-[1200px]:max-w-163.5">
          <SectionTitle>Smart Tariff Control</SectionTitle>
          <div className="mt-6 md:mt-8 space-y-8">
            <FeatureItem
              title="Dynamic Tariff Switching"
              description="Plug into time-of-use tariffs and let EnergieBee shift loads to the cheapest windows automatically."
            />
            <FeatureItem
              title="Battery Arbitrage"
              description="Charge from the grid at off-peak rates, discharge at peak. Earn the difference back to your wallet, hands-free."
            />
            <FeatureItem
              title="Peak Load Shaving"
              description="Smart limits trim your worst spikes so you never trigger demand surcharges or breaker trips."
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
