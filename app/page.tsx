import Hero from "./components/sections/Hero";
import EnergyMonitoring from "./components/sections/EnergyMonitoring";
import EnergyForecasting from "./components/sections/EnergyForecasting";
import EnergyAnalytics from "./components/sections/EnergyAnalytics";
import WhyChoose from "./components/sections/WhyChoose";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <EnergyMonitoring />
      <EnergyAnalytics />
      <EnergyForecasting />
      <WhyChoose />
    </main>
  );
}
