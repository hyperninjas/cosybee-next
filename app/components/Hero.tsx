import Hexagon from "./Hexagon";

const BG_PHOTO =
  "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=2400&q=70";
const WIND_PHOTO =
  "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=900&q=75";
const SUNFLOWER_PHOTO =
  "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=900&q=75";

function CosybeeMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 57 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M56.39 18.67 52 11.06a2.4 2.4 0 0 0-2.3-1.32H40.9c-.4 0-.78.08-1.11.24a2.4 2.4 0 0 0-.33-1.04L35.07 1.33A2.4 2.4 0 0 0 32.77 0h-8.79a2.4 2.4 0 0 0-2.3 1.33L17.29 8.94a2.4 2.4 0 0 0-.33 1.04 2.4 2.4 0 0 0-1.12-.24H7.05a2.4 2.4 0 0 0-2.3 1.33L.35 18.67a2.4 2.4 0 0 0 0 2.66l4.4 7.61a2.4 2.4 0 0 0 2.3 1.32h8.79c.4 0 .78-.09 1.12-.25.05.37.16.72.33 1.04l4.39 7.61A2.4 2.4 0 0 0 23.98 40h8.79a2.4 2.4 0 0 0 2.3-1.33l4.4-7.61c.18-.32.3-.67.33-1.03.34.16.71.24 1.11.24h8.79a2.4 2.4 0 0 0 2.3-1.32l4.39-7.61a2.4 2.4 0 0 0 0-2.66Z"
        fill="#C7B734"
      />
    </svg>
  );
}

// To use a real image instead, replace this function's return with:
//   <img src="/your-phone.png" alt="..." className={`${className} ...`} />
function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-[1.6rem] bg-[#1a1a1a] p-[2px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]`}
    >
      <div className="relative overflow-hidden rounded-[1.5rem] bg-white pb-2">
        <div className="absolute left-1/2 top-[3px] z-10 h-[10px] w-[40px] -translate-x-1/2 rounded-full bg-black" />

        <div className="flex items-center justify-between px-2.5 pt-[3px] text-[7px] font-semibold text-black">
          <span>9:41</span>
          <span className="flex items-center gap-[2px]">
            <span className="inline-block h-[5px] w-[6px] rounded-[1px] bg-black" />
            <span className="inline-block h-[5px] w-[6px] rounded-[1px] bg-black" />
            <span className="inline-block h-[5px] w-[10px] rounded-[1px] border border-black" />
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between px-2.5">
          <span className="text-[10px] font-bold text-black">Good Morning</span>
          <div className="flex items-center gap-[3px]">
            <CosybeeMark className="h-[10px] w-auto" />
            <span className="text-[7px] font-medium text-neutral-700">
              cosybee<sup className="text-[4px]">®</sup>
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-end gap-1.5 border-b border-neutral-200 px-2.5 text-[6px] text-neutral-500">
          <span className="-mb-px border-b-[1.5px] border-[#2563EB] pb-1 font-semibold text-[#2563EB]">
            Energy
          </span>
          <span className="pb-1">Solar</span>
          <span className="pb-1">Heating</span>
          <span className="pb-1">Insulation</span>
          <span className="pb-1">S</span>
        </div>

        <div className="mx-2 mt-2 rounded-md border border-neutral-200 p-1.5">
          <p className="mb-1.5 text-[7px] font-bold text-black">
            Energy performance certificate
          </p>

          <div className="mb-1.5 flex items-center justify-center gap-1.5 rounded bg-[#FAFAFA] py-1.5">
            <div className="flex flex-col items-center">
              <div className="flex h-[18px] w-[18px] items-center justify-center rounded bg-[#F97316] text-[9px] font-bold text-white">
                D
              </div>
              <span className="mt-0.5 text-[5px] text-neutral-500">
                Current rating
              </span>
            </div>
            <span className="text-[9px] text-neutral-400">→</span>
            <div className="flex flex-col items-center">
              <div className="flex h-[18px] w-[18px] items-center justify-center rounded bg-[#22C55E] text-[9px] font-bold text-white">
                B
              </div>
              <span className="mt-0.5 text-[5px] text-neutral-500">
                Potential
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="rounded border border-neutral-200 px-1 py-1">
              <p className="text-[6px] font-bold text-black">£1,890/yr</p>
              <p className="text-[4px] text-neutral-500">Current</p>
            </div>
            <div className="rounded border border-neutral-200 px-1 py-1">
              <p className="text-[6px] font-bold text-black">£1,490/yr</p>
              <p className="text-[4px] text-neutral-500">Potential</p>
            </div>
            <div className="rounded bg-[#FEF6C7] px-1 py-1">
              <p className="text-[6px] font-bold text-[#15803D]">£400/yr</p>
              <p className="text-[4px] text-[#15803D]">Save</p>
            </div>
          </div>
        </div>

        <div className="mx-2 mt-1.5 flex items-center justify-between text-[5px] text-neutral-500">
          <span>
            Last EPC: <span className="font-medium text-black">Feb 2025</span>
          </span>
          <span className="font-medium text-[#2563EB]">Update profile →</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      {/* background photo + gradients */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url('${BG_PHOTO}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* (1/4) decorative olive hexagon — bleeds in from the left edge */}
      <Hexagon
        color="#7A6F1C"
        className="pointer-events-none absolute -left-32 top-40 -z-10 w-[26rem] sm:-left-36 sm:w-[32rem] lg:-left-40 lg:top-36 lg:w-[42rem]"
      />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 pt-16 pb-24 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-16 lg:pt-24 lg:pb-32">
        {/* text */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-[5rem]">
            Solar Forecasting <span className="text-[#D7C638]">95%</span>
            <br />
            <span className="text-[#D7C638]">Accurate</span> Next Day
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-300 sm:text-lg">
            Advanced AI-powered solar production predictions. Plan your energy
            usage with confidence and maximize your solar investment with
            industry-leading accuracy.
          </p>
          <a
            href="/get-started"
            className="mt-10 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF8B27] to-[#EE3D1A] px-12 py-4 text-lg font-medium text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110 sm:text-xl"
          >
            Get Started
          </a>
        </div>

        {/* hexagon cluster — each hexagon is independently sized and placed */}
        <div className="relative mx-auto h-[400px] w-full max-w-[420px] sm:h-[480px] sm:max-w-[500px] lg:h-[560px] lg:max-w-[560px]">
          {/* (2/4) cream backdrop — biggest, holds the phone as children */}
          <Hexagon
            color="#F1E89F"
            className="absolute right-0 top-[185px] w-[220px] sm:top-[215px] sm:w-[270px] lg:top-[235px] lg:w-[320px]"
          >
            {/* phone is positioned relative to the cream hex */}
            <PhoneMockup className="absolute right-[60px] top-[22px] w-[100px] sm:right-[72px] sm:top-[25px] sm:w-[125px] lg:right-[82px] lg:top-[35px] lg:w-[155px]" />
          </Hexagon>

          {/* (3/4) sunflower — top-right */}
          <Hexagon
            src={SUNFLOWER_PHOTO}
            color="#D4A017"
            className="absolute right-2 top-1 w-[145px] sm:right-3 sm:w-[180px] lg:right-4 lg:w-[225px]"
          />

          {/* (4/4) wind turbine — middle-left */}
          <Hexagon
            src={WIND_PHOTO}
            color="#7FA9C9"
            className="absolute left-2 top-[140px] w-[130px] sm:left-3 sm:top-[175px] sm:w-[160px] lg:left-4 lg:top-[215px] lg:w-[200px]"
          />
        </div>
      </div>
    </section>
  );
}
