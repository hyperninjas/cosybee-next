import Hero from "../components/sections/smart/Hero";
import EnergyMonitoring from "../components/sections/smart/EnergyMonitoring";
import EnergyForecasting from "../components/sections/smart/EnergyForecasting";
import EnergyAnalytics from "../components/sections/smart/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/smart/SmartEnergyManagement";
import WhyEnergieBee from "../components/sections/smart/WhyEnergieBee";
import WhyEnergiebeeSolar from "../components/sections/smart/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/smart/WorksWithAnySystem";

export default function SmartPage() {
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
