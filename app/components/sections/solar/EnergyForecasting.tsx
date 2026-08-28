// import { CtaCard } from "@/app/components/ui/Cta";
import { MediaCard, SectionHeader } from "@/app/components/ui/SectionContent";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import deviceImg from "@/public/smart/energiebee-energy-usage.png";
import deviceWeatherImg from "@/public/smart/energiebee-weather-forecasts.png";
import { Section } from "../../ui/Section";
import Hexagon from "../../ui/Hexagon";
import { Container } from "@/app/components/ui/Container";

export default function EnergyForecasting() {
  return (
    <Section surface="surface" spacing="md" overflow="visible">
      <Container className="mx-auto max-w-235 px-4 lg:px-0">
        {/* cream decorative hex bleeding from the top-left */}
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -left-24 -top-10 w-[18rem] sm:-left-56 sm:w-88 lg:w-76.75 z-0"
        />
        <Hexagon
          color="#F7F2E1"
          className="pointer-events-none absolute -right-24 -bottom-10 w-[18rem] sm:-right-56 sm:w-88 lg:w-76.75 z-0"
        />
        <SectionHeader
          className="relative z-10"
          title="Intelligent Energy Forecasting"
          description="EnergieBee uses advanced weather data and AI to predict your solar energy production, helping you plan energy usage and maximise savings"
        />

        <div className=" grid justify-center mt-6 gap-6 min-[870px]:grid-cols-2 lg:gap-8 relative z-9">
          <MediaCard
            media={
              <Image
                alt="Simulated Solar Forecasts"
                src={deviceWeatherImg}
                sizes="(min-width: 1024px) 256px, (min-width: 640px) 190px, 180px"
                className="w-45 sm:w-47.5 lg:w-64"
              />
            }
            title="Simulated Solar Forecasts"
            description="Our advanced simulation engine analyses real-time weather data, historical solar patterns, and your system's specific characteristics to deliver highly accurate solar production forecasts for your home."
            bullets={[
              "AI-powered 7-day solar simulations",
              "Hourly generation predictions",
              "Cloud cover and weather impact analysis",
            ]}
          />
          <MediaCard
            media={
              <Image
                alt="Smart Energy Usage Recommendations"
                src={deviceImg}
                sizes="(min-width: 1024px) 256px, (min-width: 640px) 190px, 180px"
                className="w-45 sm:w-47.5 lg:w-64"
              />
            }
            title="Smart Energy Usage Recommendations"
            description="Get intelligent notifications on the best times to use high-energy appliances based on solar production forecasts, maximising your energy independence and savings."
            bullets={[
              "Optimal usage timing alerts",
              "Peak production windows",
              "Battery charging optimisation",
            ]}
          />
        </div>
        {/* <div className="mx-auto max-w-225 mt-12 lg:mt-16">
        <CtaCard
          glyph="sun"
          glyphColor="#A3D055"
          title="Reduce Energy Bills by Up to 40%"
          description="By using EnergieBee's smart forecasting and energy management recommendations, typical households can reduce their energy bills by 30-40%, maximising the value of their solar investment."
          buttonText="Start Monitoring"
          href="/start"
          titleClassName="!text-[25px] "
          descClassName="!text-sm"
          buttonClassName="!text-lg"
        />
      </div> */}
      </Container>
    </Section>
  );
}
