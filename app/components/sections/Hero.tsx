import { PHOTOS } from "@/app/lib/photos";
import EpcCard from "../mockups/phone/EpcCard";
import PhoneFrame from "../mockups/phone/PhoneFrame";
import PhoneGreeting from "../mockups/phone/PhoneGreeting";
import PhoneTabs from "../mockups/phone/PhoneTabs";
import { CtaButton } from "../ui/Cta";
import Hexagon from "../ui/Hexagon";
import HiveHexCluster from "../ui/HiveHexCluster";
import beeFlowerImg from "@/public/bee-flower.png";
import deviceImg from "@/public/hero-device.svg";
import windTurbineImg from "@/public/wind-turbine.png";
import heroBgImg from "@/public/hero-bg.png";
import Image from "next/image";

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
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${heroBgImg.src}')`,
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-black/30 to-black/0 h-[20%]" />
        {/* <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black to-transparent" /> */}
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
            Solar Forecasting <span className="text-[#EFDF18]">95%</span>
            <br />
            <span className="text-[#EFDF18]">Accurate</span> Next Day
          </h1>
          <p className="mt-4 max-w-md text-lg text-neutral-300">
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
          className="mx-auto w-full max-w-105 sm:max-w-125 lg:max-w-140"
          gap={5}
          left={{ src: windTurbineImg.src, color: "#7FA9C9" }}
          topRight={{ src: beeFlowerImg.src, color: "#D4A017" }}
          bottomRight={{
            color: "#E9E19E",
            children: (
              <Image
                src={deviceImg}
                alt="cosy bee app"
                className="absolute left-1/2 top-[12%] w-[65%] -translate-x-1/2"
              />
            ),
          }}
        />
      </div>
    </section>
  );
}
