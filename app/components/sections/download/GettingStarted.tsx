import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { SectionHeader } from "@/app/components/ui/SectionContent";
import { HEX_PATH } from "@/app/lib/hex";
import type { StaticImageData } from "next/image";
import downloadImg from "@/public/download/download_app-crop.png";
import accountImg from "@/public/download/create_account-crop.png";
import connectImg from "@/public/download/connect_home-crop.png";
import homeImg from "@/public/download/app_home-crop.png";

// A real sequence the user performs in order — numbering carries information.
const STEPS: ReadonlyArray<{
  title: string;
  description: string;
  image: StaticImageData;
}> = [
  {
    title: "Download the App",
    description:
      "Everything you need to manage your home's heating, in one app.",
    image: downloadImg,
  },
  {
    title: "Create Your Free Account",
    description: "Start for free with tailored heating and energy tips.",
    image: accountImg,
  },
  {
    title: "Connect Your Home",
    description: "Link your home for smart heating and energy insights.",
    image: connectImg,
  },
  {
    title: "Everything in One Place",
    description: "Monitor, manage, and optimize your home's energy with ease.",
    image: homeImg,
  },
];

/**
 * "Up and running in four steps" — one cream card per step: numbered hex
 * badge, title, description, and an app screenshot (the `-crop` mockups)
 * bleeding off the card's bottom edge. Cream + fixed dark text so the cards
 * read the same in both themes.
 */
export default function GettingStarted() {
  return (
    <Section spacing="lg">
      <Container className="max-w-7xl xl:px-0">
        <SectionHeader
          title="Up and running in four steps"
          description="From install to insight in one evening — the app guides you through each step."
        />

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map(({ title, description, image }, i) => (
            <article
              key={title}
              className="flex flex-col overflow-hidden rounded-3xl bg-[#C7B7341A] px-6 pt-7"
            >
              <svg viewBox="0 0 100 86.6" className="h-12 w-14" aria-hidden>
                <path d={HEX_PATH} fill="#EFDF18" />
                <text
                  x="50"
                  y="46"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="34"
                  fontWeight="800"
                  fill="#26272B"
                >
                  {String(i + 1).padStart(2, "0")}
                </text>
              </svg>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-[#26272B]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#3F4046] sm:text-base">
                {description}
              </p>

              {/* app screenshot — the crop mockup bleeds off the card's bottom
                  edge (last child, no bottom padding). */}
              <Image
                src={image}
                alt=""
                aria-hidden
                quality={85}
                placeholder="blur"
                sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
                className="mt-auto h-auto w-full max-w-65 mx-auto pt-8"
              />
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
