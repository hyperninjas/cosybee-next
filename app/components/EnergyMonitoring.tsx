import Hexagon from "./Hexagon";

const IMG = {
  PHONES_DESK:
    "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=900&q=75",
  WOOD: "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?auto=format&fit=crop&w=900&q=75",
};

function HexCheck({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 86.6"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <path
        d="M33,0 L67,0 Q75,0 79,6.93 L96,36.37 Q100,43.3 96,50.23 L79,79.67 Q75,86.6 67,86.6 L33,86.6 Q25,86.6 21,79.67 L4,50.23 Q0,43.3 4,36.37 L21,6.93 Q25,0 33,0 Z"
        fill="#D7C638"
      />
      <path
        d="M30 44 L43 57 L70 30"
        stroke="white"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <HexCheck className="mt-1 h-6 w-6 lg:h-7 lg:w-7" />
      <div>
        <h3 className="text-base font-semibold text-black sm:text-lg">
          {title}
        </h3>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-neutral-600 sm:text-[15px]">
          {desc}
        </p>
      </div>
    </div>
  );
}

export default function EnergyMonitoring() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-black lg:py-28">
      {/* cream decorative hex bleeding from the top-right */}
      <Hexagon
        color="#F1E89F"
        className="pointer-events-none absolute -right-24 -top-16 w-[18rem] sm:-right-20 sm:w-[22rem] lg:w-[26rem]"
      />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16">
        {/* hex cluster */}
        <div className="relative mx-auto h-[360px] w-full max-w-[440px] sm:h-[420px] lg:h-[460px]">
          <Hexagon
            src={IMG.PHONES_DESK}
            color="#3a3a3a"
            className="absolute left-2 top-0 w-[180px] sm:w-[220px] lg:w-[250px]"
          />
          <Hexagon
            src={IMG.PHONES_DESK}
            color="#3a3a3a"
            className="absolute right-0 top-[60px] w-[170px] sm:right-4 sm:w-[200px] lg:w-[225px]"
          />
          <Hexagon
            src={IMG.WOOD}
            color="#5a3a20"
            className="absolute bottom-0 left-[80px] w-[200px] sm:left-[120px] sm:w-[240px] lg:w-[270px]"
          />
        </div>

        {/* text */}
        <div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Real-Time Energy Monitoring
          </h2>
          <div className="mt-8 space-y-7">
            <Feature
              title="Live Solar Production Tracking"
              desc="Monitor your solar panel energy production in real-time. See exactly how much energy you're generating with instant updates."
            />
            <Feature
              title="Weather-Based Forecasts"
              desc="Get accurate predictions for your solar energy output based on upcoming weather patterns, helping you plan energy usage effectively."
            />
            <Feature
              title="Daily Energy Overview"
              desc="View comprehensive daily energy production with visual graphs showing peak generation times and total output."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
