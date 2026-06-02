import { CtaCard } from "../../ui/Cta";
import { MediaCard, SectionHeader } from "../../ui/SectionContent";
import Image from "next/image";
import deviceImg from "@/public/hero-device.svg";

export default function EnergyForecasting() {
  return (
    <section className="bg-white py-20 sm:py-20 lg:py-25 max-w-225 mx-auto  px-4 lg:px-0">
      <SectionHeader
        title="Cost & Usage Forecasts"
        description="EnergieBee combines historical usage, weather, and tariff data to predict tomorrow's bill — and shifts usage to minimize it"
      />

      <div className=" grid justify-center mt-6 gap-6 sm:grid-cols-2 lg:gap-8">
        <MediaCard
          media={
            <Image
              alt="Daily Cost Forecasts"
              src={deviceImg}
              className="w-45 sm:w-47.5 lg:w-64"
            />
          }
          title="Daily Cost Forecasts"
          description="See next week's projected bill, hour by hour. Tariff comparisons let you spot the cheapest windows before they happen."
          bullets={[
            "Next 7 days of projected bills",
            "Hour-by-hour cost windows",
            "Tariff comparison side-by-side",
          ]}
        />
        <MediaCard
          media={
            <Image
              alt="Usage Recommendations"
              src={deviceImg}
              className="w-45 sm:w-47.5 lg:w-64"
            />
          }
          title="Usage Recommendations"
          description="Personalized nudges on when to run high-load appliances, charge the EV, or discharge the battery — all driven by tomorrow's price curve."
          bullets={[
            "Best times to run dishwashers",
            "Optimal EV charging windows",
            "Battery discharge planning",
          ]}
        />
      </div>
      <div className="mx-auto max-w-225 mt-12 lg:mt-16">
        <CtaCard
          glyph="sun"
          glyphColor="#A3D055"
          title="Reduce Your Bill by Up to 40%"
          description="By using EnergieBee's whole-home monitoring and tariff-aware recommendations."
          buttonText="Start Saving"
          href="/start"
          titleClassName="!text-[25px] "
          descClassName="!text-sm"
          buttonClassName="!text-lg"
        />
      </div>
    </section>
  );
}
