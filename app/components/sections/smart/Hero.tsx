// import { PHOTOS } from "@/app/lib/photos";
// import EpcCard from "@/app/components/mockups/phone/EpcCard";
// import PhoneFrame from "@/app/components/mockups/phone/PhoneFrame";
// import PhoneGreeting from "@/app/components/mockups/phone/PhoneGreeting";
// import PhoneTabs from "@/app/components/mockups/phone/PhoneTabs";
import { CtaButton } from "@/app/components/ui/Cta";
import { Heading, Text } from "@/app/components/ui/Typography";
// import Hexagon from "@/app/components/ui/Hexagon";
// import HiveHexCluster from "@/app/components/ui/HiveHexCluster";
// import beeFlowerImg from "@/public/bee-flower.png";
// import deviceImg from "@/public/smart/energiebee-app-epc-rating-improvement.png";
// import windTurbineImg from "@/public/wind-turbine.png";
import heroBgImg from "@/public/Cover/energiebee-smart-cover.png";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Section } from "@/app/components/ui/Section";

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
    <Section surface="dark" spacing="none" className="isolate flex flex-col justify-center min-h-[75vh] md:min-h-[85vh]">
      {/* background photo + gradients */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Image
          src={heroBgImg}
          alt="hero image of smart "
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

      <div className="relative mx-auto w-full max-w-360 items-center pt-16 pb-24 px-6 lg:px-30 lg:pt-15 lg:pb-11">
        {/* (1/4) decorative olive hexagon — bleeds in from the left edge */}
        {/* <Hexagon
          color="#403A07"
          className="pointer-events-none absolute -left-32 top-1/2 -z-10 w-104 -translate-y-1/2 sm:-left-36 sm:w-lg lg:-left-33 lg:w-[403.73px] h-[374.5px]"
        /> */}
        {/* text */}
        <div className="relative z-10 ">
          <Heading
            as="h1"
            variant="display"
            className="whitespace-pre-line"
          >
            {"Works With \n Your "}
            <span className="text-[#EFDF18]">Smart Home</span>
          </Heading>
          <Text variant="heroLead" className="mt-5 max-w-145.5">
            Connect your solar system, battery and smart home devices to see
            everything in one place. AI-powered insights help you understand
            energy production, usage and savings — and make smarter decisions
            every day.
          </Text>
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
                alt="energie Bee app screen"
                sizes="(min-width: 1024px) 200px, (min-width: 640px) 180px, 150px"
                className="absolute left-1/2 top-[15.5%] w-[62%] -translate-x-1/2"
              />
            ),
          }}
        /> */}
      </div>
    </Section>
  );
}
