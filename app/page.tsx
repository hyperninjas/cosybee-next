import Hero from "./components/Hero";
import EnergyMonitoring from "./components/EnergyMonitoring";
import EnergyForecasting from "./components/EnergyForecasting";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <EnergyMonitoring />
      <EnergyForecasting />
    </main>
  );
}
