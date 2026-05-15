import { CtaCard } from "./Cta";
import { MediaCard, SectionHeader } from "./SectionContent";

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
            <svg viewBox="0 0 57 40" className="h-2.5 w-auto" aria-hidden>
              <path
                d="M56.39 18.67 52 11.06a2.4 2.4 0 0 0-2.3-1.32H40.9c-.4 0-.78.08-1.11.24a2.4 2.4 0 0 0-.33-1.04L35.07 1.33A2.4 2.4 0 0 0 32.77 0h-8.79a2.4 2.4 0 0 0-2.3 1.33L17.29 8.94a2.4 2.4 0 0 0-.33 1.04 2.4 2.4 0 0 0-1.12-.24H7.05a2.4 2.4 0 0 0-2.3 1.33L.35 18.67a2.4 2.4 0 0 0 0 2.66l4.4 7.61a2.4 2.4 0 0 0 2.3 1.32h8.79c.4 0 .78-.09 1.12-.25.05.37.16.72.33 1.04l4.39 7.61A2.4 2.4 0 0 0 23.98 40h8.79a2.4 2.4 0 0 0 2.3-1.33l4.4-7.61c.18-.32.3-.67.33-1.03.34.16.71.24 1.11.24h8.79a2.4 2.4 0 0 0 2.3-1.32l4.39-7.61a2.4 2.4 0 0 0 0-2.66Z"
                fill="#C7B734"
              />
            </svg>
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
    <section className="bg-white px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
      <SectionHeader
        title="Intelligent Energy Forecasting"
        description="Energiebee uses advanced weather data and AI to predict your solar energy production, helping you plan energy usage and maximize savings."
      />

      <div className="mx-auto mt-12 grid max-w-[1280px] grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8">
        <MediaCard
          media={<MiniPhone className="w-[180px] sm:w-[190px] lg:w-[200px]" />}
          title="Weather-Based Bloom Forecasts"
          description="Our intelligent forecasting system uses real-time weather data combined with your garden's historical performance to predict sunflower blooms and bee activity with remarkable accuracy."
          bullets={[
            "7-day solar production forecasts",
            "Hourly generation predictions",
            "Weather impact analysis",
          ]}
        />
        <MediaCard
          media={<MiniPhone className="w-[180px] sm:w-[190px] lg:w-[200px]" />}
          title="Seasonal Pattern Analysis"
          description="Track how your energy production changes through the seasons. Our AI learns from year-over-year data to deliver ever-more-accurate predictions tailored to your location."
          bullets={[
            "Year-on-year comparisons",
            "Sunshine hour modeling",
            "Peak season alerts",
          ]}
        />
        <MediaCard
          media={<MiniPhone className="w-[180px] sm:w-[190px] lg:w-[200px]" />}
          title="Smart Usage Recommendations"
          description="Get personalized recommendations on when to run appliances, charge batteries, or sell back to the grid based on forecasted production."
          bullets={[
            "Optimal usage timing",
            "Battery charging plans",
            "Grid export windows",
          ]}
        />
      </div>

      <div className="mx-auto mt-12 max-w-[1280px] lg:mt-16">
        <CtaCard
          glyph="sun"
          glyphColor="#A3D055"
          title="Reduce Energy Bills by Up to 40%"
          description="By using energiebee's smart forecasting and energy management recommendations."
          buttonText="Start Monitoring"
          href="/start"
        />
      </div>
    </section>
  );
}
