import HomeHero from "./components/sections/home/HomeHero";
import PerfectHarmony from "./components/sections/home/PerfectHarmony";
import HeatingSolutions from "./components/sections/home/HeatingSolutions";
import HomeSolarForecasting from "./components/sections/home/HomeSolarForecasting";
import HomeEnergyManagement from "./components/sections/home/HomeEnergyManagement";
import WhyThousands from "./components/sections/home/WhyThousands";
import ReadyToReduce from "./components/sections/home/ReadyToReduce";

export default function Home() {
  return (
    <main className="flex-1">
      <HomeHero />
      <PerfectHarmony />
      <HeatingSolutions />
      <HomeSolarForecasting />
      <HomeEnergyManagement />
      <WhyThousands />
      <ReadyToReduce />
    </main>
  );
}
