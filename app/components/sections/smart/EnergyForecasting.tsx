import { CtaCard } from "../../ui/Cta";
import { MediaCard, SectionHeader } from "../../ui/SectionContent";
import Image from "next/image";
import deviceImg from "@/public/hero-device.svg";

export default function EnergyForecasting() {
  return (
    <section className="bg-white py-20 sm:py-20 lg:py-25 max-w-225 mx-auto  px-4 lg:px-0">
      <SectionHeader
        title="Predictive Analytics"
        description="EnergieBee uses behavioral data and AI to predict your home's energy patterns, helping you optimize usage and maximize savings"
      />

      <div className=" grid justify-center mt-6 gap-6 sm:grid-cols-2 lg:gap-8">
        <MediaCard
          media={
            <Image
              alt="Behavioral Pattern Forecasts"
              src={deviceImg}
              className="w-45 sm:w-47.5 lg:w-64"
            />
          }
          title="Behavioral Pattern Forecasts"
          description="Our intelligent system learns from your daily habits to predict when each room will be in use — and pre-conditions the energy load accordingly."
          bullets={[
            "7-day device usage forecasts",
            "Hourly load predictions",
            "Pattern-based recommendations",
          ]}
        />
        <MediaCard
          media={
            <Image
              alt="Smart Energy Usage Recommendations"
              src={deviceImg}
              className="w-45 sm:w-47.5 lg:w-64"
            />
          }
          title="Smart Energy Usage Recommendations"
          description="Get intelligent notifications on the best times to use high-energy appliances based on solar production forecasts, maximizing energy independence and savings."
          bullets={[
            "Optimal usage timing alerts",
            "Peak production windows",
            "Battery charging suggestions",
          ]}
        />
      </div>
      <div className="mx-auto max-w-225 mt-12 lg:mt-16">
        <CtaCard
          glyph="sun"
          glyphColor="#A3D055"
          title="Reduce Energy Bills by Up to 40%"
          description="By using EnergieBee's smart forecasting and energy management recommendations."
          buttonText="Start Monitoring"
          href="/start"
          titleClassName="!text-[25px] "
          descClassName="!text-sm"
          buttonClassName="!text-lg"
        />
      </div>
    </section>
  );
}
