import Hero from "../components/sections/heating/Hero";
import EnergyMonitoring from "../components/sections/heating/EnergyMonitoring";
import EnergyForecasting from "../components/sections/heating/EnergyForecasting";
import EnergyAnalytics from "../components/sections/heating/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/heating/SmartEnergyManagement";
import WhyEnergieBee from "../components/sections/heating/WhyEnergieBee";
import WhyEnergiebeeSolar from "../components/sections/heating/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/heating/WorksWithAnySystem";

export default function HeatingPage() {
  return (
    <main className="flex-1">
      <Hero />
      <EnergyMonitoring />
      <EnergyAnalytics />
      <SmartEnergyManagement />
      <WhyEnergieBee />
      <WhyEnergiebeeSolar />
      <WorksWithAnySystem />
      <EnergyForecasting />
    </main>
  );
}
