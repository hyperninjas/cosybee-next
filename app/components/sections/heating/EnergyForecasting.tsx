import { CtaCard } from "../../ui/Cta";
import { MediaCard, SectionHeader } from "../../ui/SectionContent";
import Image from "next/image";
import deviceImg from "@/public/hero-device.svg";

export default function EnergyForecasting() {
  return (
    <section className="bg-white py-20 sm:py-20 lg:py-25 max-w-225 mx-auto  px-4 lg:px-0">
      <SectionHeader
        title="Predictive Heating Schedules"
        description="Energiebee uses weather forecasts and your daily patterns to pre-heat efficiently — your home is always ready, never wasteful"
      />

      <div className=" grid justify-center mt-6 gap-6 sm:grid-cols-2 lg:gap-8">
        <MediaCard
          media={
            <Image
              alt="Weather-Based Pre-Heating"
              src={deviceImg}
              className="w-45 sm:w-47.5 lg:w-64"
            />
          }
          title="Weather-Based Pre-Heating"
          description="The system reads tomorrow's forecast and starts heating early enough to hit your morning target — no cold mornings, no overshoot waste."
          bullets={[
            "7-day weather-aware forecasts",
            "Cold-snap auto-adjustments",
            "Window-open detection",
          ]}
        />
        <MediaCard
          media={
            <Image
              alt="Routine Learning"
              src={deviceImg}
              className="w-45 sm:w-47.5 lg:w-64"
            />
          }
          title="Routine Learning"
          description="Your home learns when you wake up, leave, and return. Heating ramps and dials down automatically based on real patterns, not rigid timers."
          bullets={[
            "Morning ramp-up automation",
            "Evening wind-down detection",
            "Holiday mode predictions",
          ]}
        />
      </div>
      <div className="mx-auto max-w-225 mt-12 lg:mt-16">
        <CtaCard
          glyph="sun"
          glyphColor="#A3D055"
          title="Reduce Heating Bills by Up to 35%"
          description="By using energiebee's predictive heating schedules and zone-aware control."
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
