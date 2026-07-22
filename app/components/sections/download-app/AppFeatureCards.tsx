import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { SectionHeader } from "@/app/components/ui/SectionContent";
import type { StaticImageData } from "next/image";
import heatingImg from "@/public/download-app/heating-solution.png";
import solarImg from "@/public/download-app/solar-forcasting.png";
import energyImg from "@/public/download-app/energy-management.png";

const CARDS: ReadonlyArray<{
  title: string;
  description: string;
  image: StaticImageData;
}> = [
  {
    title: "Heating Solutions",
    description:
      "Smart heating control for comfort, efficiency, and lower energy costs.",
    image: heatingImg,
  },
  {
    title: "Solar Forecasting",
    description:
      "Predict solar generation to maximize savings and energy independence.",
    image: solarImg,
  },
  {
    title: "Energy Management",
    description:
      "Monitor, optimize, and reduce your home's overall energy consumption.",
    image: energyImg,
  },
];

/**
 * "One app does the job" — three photo cards, one per pillar of the app.
 * The title + description sit over the top of each photo; a white fade
 * keeps them readable regardless of the image behind.
 */
export default function AppFeatureCards() {
  return (
    <Section spacing="none" className="pb-25">
      <Container>
        <SectionHeader
          title="One app does the job"
          description="With EnergieBee, one app looks after your heating, solar, and energy — and makes life more comfortable for you and your loved ones."
        />

        <div className="mt-10 grid grid-cols-1 gap-6 min-[900px]:grid-cols-3">
          {CARDS.map((card) => (
            <article
              key={card.title}
              className="relative aspect-384/430 overflow-hidden rounded-2xl"
            >
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                quality={85}
                className="object-cover object-center"
              />
              <div className="absolute inset-x-0 top-0 bg-linear-to-b from-white via-white/90 to-transparent px-6 pb-20 pt-7 text-center">
                <h3 className="text-xl font-extrabold leading-tight text-[#26272B] sm:text-2xl">
                  {card.title}
                </h3>
                <p className="mx-auto mt-2 max-w-70 text-sm leading-relaxed text-[#3F4046] sm:text-base">
                  {card.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
