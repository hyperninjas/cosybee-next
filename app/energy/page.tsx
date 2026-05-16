import Hero from "../components/sections/energy/Hero";
import EnergyMonitoring from "../components/sections/energy/EnergyMonitoring";
import EnergyForecasting from "../components/sections/energy/EnergyForecasting";
import EnergyAnalytics from "../components/sections/energy/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/energy/SmartEnergyManagement";
import WhyEnergieBee from "../components/sections/energy/WhyEnergieBee";
import WhyEnergiebeeSolar from "../components/sections/energy/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/energy/WorksWithAnySystem";

export default function EnergyPage() {
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
