import Hero from "./components/Hero";
import EnergyMonitoring from "./components/EnergyMonitoring";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <EnergyMonitoring />
    </main>
  );
}
