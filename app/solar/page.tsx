import Hero from "../components/sections/Hero";
import EnergyMonitoring from "../components/sections/EnergyMonitoring";
import EnergyForecasting from "../components/sections/EnergyForecasting";
import EnergyAnalytics from "../components/sections/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/SmartEnergyManagement";
import WhyEnergieBee from "../components/sections/WhyEnergieBee";
import WhyEnergiebeeSolar from "../components/sections/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/WorksWithAnySystem";

export default function Home() {
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
