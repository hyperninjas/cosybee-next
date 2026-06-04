// import { PHOTOS } from "@/app/lib/photos";
// import EpcCard from "../../mockups/phone/EpcCard";
// import PhoneFrame from "../../mockups/phone/PhoneFrame";
// import PhoneGreeting from "../../mockups/phone/PhoneGreeting";
// import PhoneTabs from "../../mockups/phone/PhoneTabs";
import { CtaButton } from "../../ui/Cta";
// import Hexagon from "../../ui/Hexagon";
// import HiveHexCluster from "../../ui/HiveHexCluster";
// import beeFlowerImg from "@/public/bee-flower.png";
// import deviceImg from "@/public/solar/energiebee-app-solar-potential-epc-rating.png";
// import windTurbineImg from "@/public/wind-turbine.png";
import heroBgImg from "@/public/Cover/energiebee-solar-cover.png";
import Image from "next/image";

// function HeroPhone({ className = "" }: { className?: string }) {
//   return (
//     <PhoneFrame className={className}>
//       <PhoneGreeting />
//       <PhoneTabs />
//       <EpcCard />
//     </PhoneFrame>
//   );
// }

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white flex flex-col justify-center min-h-[85vh]">
      {/* background photo + gradients */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Image
          src={heroBgImg}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={85}
          placeholder="blur"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/40 h-full" />
      </div>

      <div className="relative mx-auto w-full max-w-360 items-center pt-16 pb-24 px-4 sm:px-6 lg:px-30 lg:pt-15 lg:pb-11">
        {/* (1/4) decorative olive hexagon — bleeds in from the left edge */}
        {/* <Hexagon
          color="#403A07"
          className="pointer-events-none absolute -left-32 top-1/2 -z-10 w-104 -translate-y-1/2 sm:-left-36 sm:w-lg lg:-left-33 lg:w-[403.73px] h-[374.5px]"
        /> */}
        {/* text */}
        <div className="relative z-10 ">
          <h1 className="text-4xl font-extrabold leading-[110%] tracking-tight sm:text-5xl lg:text-[75px]">
            Solar Forecasting <span className="text-[#EFDF18]">95%</span>
            <br />
            <span className="text-[#EFDF18]">Accurate</span> Next Day
          </h1>
          <p className="mt-5 max-w-129.5 text-base sm:text-[22px] leading-7 text-neutral-300">
            Advanced AI-powered solar production predictions. Plan your energy
            usage with confidence and maximise your solar investment with
            industry-leading accuracy.
          </p>
          <CtaButton href="/get-started" size="md" className="mt-10">
            Get Started
          </CtaButton>
        </div>

        {/* hexagon cluster — same canonical hive shape as the rest of the page */}
        {/* <HiveHexCluster
          className="mx-auto w-full max-w-105 sm:max-w-125 lg:max-w-140"
          gap={5}
          left={{
            src: windTurbineImg,
            alt: "Wind turbines",
            color: "#7FA9C9",
          }}
          topRight={{
            src: beeFlowerImg,
            alt: "Bee on a flower",
            color: "#D4A017",
          }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="energie bee app screen"
                sizes="(min-width: 1024px) 200px, (min-width: 640px) 180px, 150px"
                className="absolute left-1/2 top-[12%] w-[65%] -translate-x-1/2"
              />
            ),
          }}
        /> */}
      </div>
    </section>
  );
}
