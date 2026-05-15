import { PHOTOS } from "@/app/lib/photos";
import EpcCard from "../mockups/phone/EpcCard";
import PhoneFrame from "../mockups/phone/PhoneFrame";
import PhoneGreeting from "../mockups/phone/PhoneGreeting";
import PhoneTabs from "../mockups/phone/PhoneTabs";
import { CtaButton } from "../ui/Cta";
import Hexagon from "../ui/Hexagon";

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
        color="#7A6F1C"
        className="pointer-events-none absolute -left-32 top-40 -z-10 w-[26rem] sm:-left-36 sm:w-[32rem] lg:-left-40 lg:top-36 lg:w-[42rem]"
      />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 pt-16 pb-24 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-16 lg:pt-24 lg:pb-32">
        {/* text */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-[2.5rem]">
            Solar Forecasting <span className="text-[#D7C638]">95%</span>
            <br />
            <span className="text-[#D7C638]">Accurate</span> Next Day
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-300 sm:text-lg">
            Advanced AI-powered solar production predictions. Plan your energy
            usage with confidence and maximize your solar investment with
            industry-leading accuracy.
          </p>
          <CtaButton href="/get-started" size="lg" className="mt-10">
            Get Started
          </CtaButton>
        </div>

        {/* hexagon cluster — each hexagon is independently sized and placed */}
        <div className="relative mx-auto h-[400px] w-full max-w-[420px] sm:h-[480px] sm:max-w-[500px] lg:h-[560px] lg:max-w-[560px]">
          {/* (2/4) cream backdrop — biggest, bottom-right, back layer */}
          <Hexagon
            color="#F1E89F"
            className="absolute right-0 top-[185px] w-[220px] sm:top-[215px] sm:w-[270px] lg:top-[235px] lg:w-[320px]"
          >
            <HeroPhone className="absolute right-[60px] top-[22px] w-[100px] sm:right-[72px] sm:top-[25px] sm:w-[125px] lg:right-[82px] lg:top-[35px] lg:w-[155px]" />
          </Hexagon>

          {/* (3/4) sunflower — top-right */}
          <Hexagon
            src={PHOTOS.sunflower}
            color="#D4A017"
            className="absolute right-2 top-1 w-[145px] sm:right-3 sm:w-[180px] lg:right-4 lg:w-[225px]"
          />

          {/* (4/4) wind turbine — middle-left */}
          <Hexagon
            src={PHOTOS.windTurbine}
            color="#7FA9C9"
            className="absolute left-2 top-[140px] w-[130px] sm:left-3 sm:top-[175px] sm:w-[160px] lg:left-4 lg:top-[215px] lg:w-[200px]"
          />
        </div>
      </div>
    </section>
  );
}
