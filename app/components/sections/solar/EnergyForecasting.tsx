import { CtaCard } from "../../ui/Cta";
import { MediaCard, SectionHeader } from "../../ui/SectionContent";
import Image, { StaticImageData } from "next/image";
import deviceImg from "@/public/hero-device.svg";
import { type InlineGlyphName } from "../../ui/SectionContent";
import { type ReactNode } from "react";

export type MediaCardContent = {
  title: string;
  description: string;
  bullets: string[];
  /** Image rendered inside the card's media slot. Defaults to the
   *  shared device illustration. */
  mediaSrc?: StaticImageData | string;
  mediaAlt?: string;
};

export type ForecastingCta = {
  title: ReactNode;
  description: ReactNode;
  buttonText: string;
  href: string;
  glyph?: InlineGlyphName;
  glyphColor?: string;
};

export type EnergyForecastingProps = {
  title?: string;
  description?: string;
  cards?: MediaCardContent[];
  cta?: ForecastingCta;
};

const DEFAULT_CARDS: MediaCardContent[] = [
  {
    title: "Weather-Based Bloom Forecasts",
    description:
      "Our intelligent forecasting system uses real-time weather data combined with your garden's historical performance to predict sunflower blooms and bee activity with remarkable accuracy.",
    bullets: [
      "7-day solar production forecasts",
      "Hourly generation predictions",
      "Weather impact analysis",
    ],
  },
  {
    title: "Smart Energy Usage Recommendations",
    description:
      "Get intelligent notifications on the best times to use high-energy appliances based on solar production forecasts, maximizing your energy independence and savings.",
    bullets: [
      "Optimal usage timing alerts",
      "Peak production windows",
      "Battery charging optimization",
    ],
  },
];

const DEFAULT_CTA: ForecastingCta = {
  glyph: "sun",
  glyphColor: "#A3D055",
  title: "Reduce Energy Bills by Up to 40%",
  description:
    "By using EnergieBee's smart forecasting and energy management recommendations.",
  buttonText: "Start Monitoring",
  href: "/start",
};

export default function EnergyForecasting({
  title = "Intelligent Energy Forecasting",
  description = "EnergieBee uses advanced weather data and AI to predict your solar energy production, helping you plan energy usage and maximize savings",
  cards = DEFAULT_CARDS,
  cta = DEFAULT_CTA,
}: EnergyForecastingProps = {}) {
  return (
    <section className="bg-white py-20 sm:py-20 lg:py-25 max-w-225 mx-auto  px-4 lg:px-0">
      <SectionHeader title={title} description={description} />

      <div className=" grid justify-center mt-6 gap-6 sm:grid-cols-2 lg:gap-8">
        {cards.map((c) => (
          <MediaCard
            key={c.title}
            media={
              <Image
                alt={c.mediaAlt ?? c.title}
                src={c.mediaSrc ?? deviceImg}
                className="w-45 sm:w-47.5 lg:w-64"
              />
            }
            title={c.title}
            description={c.description}
            bullets={c.bullets}
          />
        ))}
      </div>
      <div className="mx-auto max-w-225 mt-12 lg:mt-16">
        <CtaCard
          glyph={cta.glyph}
          glyphColor={cta.glyphColor}
          title={cta.title}
          description={cta.description}
          buttonText={cta.buttonText}
          href={cta.href}
          titleClassName="!text-[25px] "
          descClassName="!text-sm"
          buttonClassName="!text-lg"
        />
      </div>
    </section>
  );
}
