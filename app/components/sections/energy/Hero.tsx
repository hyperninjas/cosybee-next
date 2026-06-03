// import { PHOTOS } from "@/app/lib/photos";
// import EpcCard from "../../mockups/phone/EpcCard";
// import PhoneFrame from "../../mockups/phone/PhoneFrame";
// import PhoneGreeting from "../../mockups/phone/PhoneGreeting";
// import PhoneTabs from "../../mockups/phone/PhoneTabs";
import { CtaButton } from "../../ui/Cta";
import Hexagon from "../../ui/Hexagon";
import HiveHexCluster from "../../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/device-snap-energy-hero.png";
import windTurbineImg from "@/public/wind-turbine.png";
import heroBgImg from "@/public/energy-hero-bg.png";
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
          quality={100}
          placeholder="blur"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-black/30 to-black/0 h-[20%]" />
      </div>

      <div className="relative mx-auto grid max-w-360 grid-cols-1 items-center gap-12 px-6 pt-16 pb-24 sm:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-30 lg:pl-71.5 lg:pt-15 lg:pb-11">
        {/* (1/4) decorative olive hexagon — bleeds in from the left edge */}
        <Hexagon
          color="#403A07"
          className="pointer-events-none absolute -left-32 top-1/2 -z-10 w-104 -translate-y-1/2 sm:-left-36 sm:w-lg lg:-left-33 lg:w-[403.73px] h-[374.5px]"
        />
        {/* text */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl font-extrabold leading-[120%] tracking-tight xl:text-[2.5rem]">
            Total <span className="text-[#EFDF18]">Energy Control</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-neutral-300">
            Track every watt your home uses — across grid, solar, battery, and
            individual devices. One dashboard, one source of truth, real
            savings.
          </p>
          <CtaButton href="/get-started" size="md" className="mt-10">
            Get Started
          </CtaButton>
        </div>

        {/* hexagon cluster — same canonical hive shape as the rest of the page */}
        <HiveHexCluster
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
                className="absolute left-1/2 top-[14%] w-[65%] -translate-x-1/2"
              />
            ),
          }}
        />
      </div>
    </section>
  );
}
