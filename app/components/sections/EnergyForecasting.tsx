import { CtaCard } from "../ui/Cta";
import CosybeeMark from "../ui/CosybeeMark";
import { MediaCard, SectionHeader } from "../ui/SectionContent";

/** Compact phone mockup tuned to sit inside a MediaCard's media slot. */
function MiniPhone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-[1.8rem] bg-black p-[2px] shadow-[0_15px_30px_-12px_rgba(0,0,0,0.3)]`}
    >
      <div className="relative aspect-[9/13] overflow-hidden rounded-[1.7rem] bg-white">
        <div className="absolute left-1/2 top-1.5 z-10 h-3 w-12 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center justify-between px-3 pt-1 text-[8px] font-semibold text-black">
          <span>9:41</span>
          <span className="flex items-center gap-0.5">
            <span className="inline-block h-1.5 w-1.5 rounded-[1px] bg-black" />
            <span className="inline-block h-1.5 w-1.5 rounded-[1px] bg-black" />
            <span className="inline-block h-1.5 w-2.5 rounded-[1px] border border-black" />
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between px-3">
          <span className="text-[11px] font-bold text-black">Good Morning</span>
          <div className="flex items-center gap-1">
            <CosybeeMark className="h-2.5 w-auto" />
            <span className="text-[8px] font-medium text-neutral-700">
              cosybee<sup className="text-[5px]">®</sup>
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-end gap-2 border-b border-neutral-200 px-3 text-[7px] text-neutral-500">
          <span className="-mb-px border-b-[1.5px] border-[#2563EB] pb-1 font-semibold text-[#2563EB]">
            Energy
          </span>
          <span className="pb-1">Solar</span>
          <span className="pb-1">Heating</span>
          <span className="pb-1">Insulation</span>
        </div>

        <div className="mx-2 mt-2 rounded-md border border-neutral-200 p-1.5">
          <p className="mb-1.5 text-[8px] font-bold text-black">
            Energy performance certificate
          </p>
          <div className="mb-1.5 flex items-center justify-center gap-1.5 rounded bg-neutral-50 py-1">
            <div className="flex flex-col items-center">
              <div className="flex h-4 w-4 items-center justify-center rounded bg-[#F97316] text-[8px] font-bold text-white">
                D
              </div>
              <span className="mt-0.5 text-[5px] text-neutral-500">
                Current rating
              </span>
            </div>
            <span className="text-[8px] text-neutral-400">→</span>
            <div className="flex flex-col items-center">
              <div className="flex h-4 w-4 items-center justify-center rounded bg-[#22C55E] text-[8px] font-bold text-white">
                B
              </div>
              <span className="mt-0.5 text-[5px] text-neutral-500">
                Potential
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0.5 text-center">
            <div className="rounded border border-neutral-200 px-0.5 py-0.5">
              <p className="text-[6px] font-bold text-black">£1,890/yr</p>
              <p className="text-[4px] text-neutral-500">Current</p>
            </div>
            <div className="rounded border border-neutral-200 px-0.5 py-0.5">
              <p className="text-[6px] font-bold text-black">£1,490/yr</p>
              <p className="text-[4px] text-neutral-500">Potential</p>
            </div>
            <div className="rounded bg-[#FEF6C7] px-0.5 py-0.5">
              <p className="text-[6px] font-bold text-[#15803D]">£400/yr</p>
              <p className="text-[4px] text-[#15803D]">Save</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EnergyForecasting() {
  return (
    <section className="bg-white px-6 py-20 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
      <SectionHeader
        title="Intelligent Energy Forecasting"
        description="Energiebee uses advanced weather data and AI to predict your solar energy production, helping you plan energy usage and maximize savings."
      />

      <div className="mx-auto flex justify-center mt-12 max-w-7xl gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8">
        <MediaCard
          media={<MiniPhone className="w-45 sm:w-47.5 lg:w-50" />}
          title="Weather-Based Bloom Forecasts"
          description="Our intelligent forecasting system uses real-time weather data combined with your garden's historical performance to predict sunflower blooms and bee activity with remarkable accuracy."
          bullets={[
            "7-day solar production forecasts",
            "Hourly generation predictions",
            "Weather impact analysis",
          ]}
        />
        <MediaCard
          media={<MiniPhone className="w-45 sm:w-47.5 lg:w-50" />}
          title="Seasonal Pattern Analysis"
          description="Track how your energy production changes through the seasons. Our AI learns from year-over-year data to deliver ever-more-accurate predictions tailored to your location."
          bullets={[
            "Year-on-year comparisons",
            "Sunshine hour modeling",
            "Peak season alerts",
          ]}
        />
      </div>
      <div className="mx-auto max-w-225 mt-12 lg:mt-16">
        <CtaCard
          glyph="sun"
          glyphColor="#A3D055"
          title="Reduce Energy Bills by Up to 40%"
          description="By using energiebee's smart forecasting and energy management recommendations."
          buttonText="Start Monitoring"
          href="/start"
          titleClassName="!text-[25px] "
          descClassName="!text-sm"
        />
      </div>
    </section>
  );
}
