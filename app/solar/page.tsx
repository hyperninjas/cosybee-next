import Hero from "../components/sections/solar/Hero";
import EnergyMonitoring from "../components/sections/solar/EnergyMonitoring";
import EnergyForecasting from "../components/sections/solar/EnergyForecasting";
import EnergyAnalytics from "../components/sections/solar/EnergyAnalytics";
import SmartEnergyManagement from "../components/sections/solar/SmartEnergyManagement";
import WhyEnergieBee from "../components/sections/solar/WhyEnergieBee";
import WhyEnergiebeeSolar from "../components/sections/solar/WhyEnergiebeeSolar";
import WorksWithAnySystem from "../components/sections/solar/WorksWithAnySystem";

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
