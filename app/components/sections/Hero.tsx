import { PHOTOS } from "@/app/lib/photos";
import EpcCard from "../mockups/phone/EpcCard";
import PhoneFrame from "../mockups/phone/PhoneFrame";
import PhoneGreeting from "../mockups/phone/PhoneGreeting";
import PhoneTabs from "../mockups/phone/PhoneTabs";
import { CtaButton } from "../ui/Cta";
import Hexagon from "../ui/Hexagon";
import HiveHexCluster from "../ui/HiveHexCluster";

function HeroPhone({ className = "" }: { className?: string }) {
  return (
    <PhoneFrame className={className}>
      <PhoneGreeting />
      <PhoneTabs />
      <EpcCard />
    </PhoneFrame>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      {/* background photo + gradients */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url('${PHOTOS.heroBg}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* (1/4) decorative olive hexagon — bleeds in from the left edge */}
      <Hexagon
        color="#403A07"
        className="pointer-events-none absolute -left-32 top-1/2 -z-10 w-104 -translate-y-1/2 sm:-left-36 sm:w-lg lg:-left-33 lg:w-[373.73px] h-[374.5px]"
      />

      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 pt-16 pb-24 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-16 lg:pl-71.5 lg:pt-24 lg:pb-32">
        {/* text */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl font-extrabold leading-[120%] tracking-tight sm:text-5xl lg:text-6xl xl:text-[2.5rem]">
            Solar Forecasting <span className="text-[#D7C638]">95%</span>
            <br />
            <span className="text-[#D7C638]">Accurate</span> Next Day
          </h1>
          <p className="mt-4 max-w-md text-lg text-neutral-300 sm:text-lg">
            Advanced AI-powered solar production predictions. Plan your energy
            usage with confidence and maximize your solar investment with
            industry-leading accuracy.
          </p>
          <CtaButton href="/get-started" size="md" className="mt-10">
            Get Started
          </CtaButton>
        </div>

        {/* hexagon cluster — same canonical hive shape as the rest of the page */}
        <HiveHexCluster
          className="mx-auto w-full max-w-[420px] sm:max-w-[500px] lg:max-w-[560px]"
          left={{ src: PHOTOS.windTurbine, color: "#7FA9C9" }}
          topRight={{ src: PHOTOS.sunflower, color: "#D4A017" }}
          bottomRight={{
            color: "#F1E89F",
            children: (
              <HeroPhone className="absolute left-1/2 top-[12%] w-[60%] -translate-x-1/2" />
            ),
          }}
        />
      </div>
    </section>
  );
}
