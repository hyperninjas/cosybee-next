import Hero from "./components/sections/Hero";
import EnergyMonitoring from "./components/sections/EnergyMonitoring";
import EnergyForecasting from "./components/sections/EnergyForecasting";
import EnergyAnalytics from "./components/sections/EnergyAnalytics";
import SmartEnergyManagement from "./components/sections/SmartEnergyManagement";
import WhyChoose from "./components/sections/WhyChoose";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <EnergyMonitoring />
      <EnergyAnalytics />
      <SmartEnergyManagement />
      <EnergyForecasting />
      <WhyChoose />
    </main>
  );
}
