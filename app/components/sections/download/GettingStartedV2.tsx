"use client";

import { useEffect, useRef, useState } from "react";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { SectionHeader } from "@/app/components/ui/SectionContent";
import { HEX_PATH } from "@/app/lib/hex";
import type { StaticImageData } from "next/image";
import downloadImg from "@/public/download-app/download_app-full.png";
import accountImg from "@/public/download-app/create_account-full.png";
import connectImg from "@/public/download-app/connect_home-full.png";
import homeImg from "@/public/download-app/app_home-full.png";

// A real sequence the user performs in order — numbering carries information.
const STEPS: ReadonlyArray<{
  title: string;
  description: string;
  image: StaticImageData;
}> = [
  {
    title: "Download the App",
    description:
      "Get the EnergieBee app from the App Store or Google Play and start your smart energy journey in minutes.",
    image: downloadImg,
  },
  {
    title: "Create Your Free Account",
    description:
      "Sign up with your email in under a minute. No credit card required, no hidden commitments.",
    image: accountImg,
  },
  {
    title: "Connect Your Home",
    description:
      "Follow the guided setup to connect your heating system, solar panels, or energy tariff for personalized insights.",
    image: connectImg,
  },
  {
    title: "Manage Everything in One Place",
    description:
      "Track heating, solar generation, energy usage, and savings from a single intelligent dashboard.",
    image: homeImg,
  },
];

/**
 * "Up and running in four steps", v2 — a PINNED scrollytelling section
 * (desktop): a tall runway wrapper provides scroll distance while the section
 * content sticks to the viewport, so the page appears to pause here until all
 * four steps have played through. Scroll progress through the runway — not
 * clicks — drives which step is active: the active step's hex turns solid
 * yellow and the full app screenshot in the cream panel on the left
 * crossfades to that step's shot (the complete `-full` phone mockups).
 *
 * Below `lg` there's no pinning: the timeline renders as a plain readable
 * list (every hex solid yellow), the panel shows the first screenshot, and
 * the scroll listener never attaches.
 */
export default function GettingStartedV2() {
  // Continuous scroll progress through the runway (0–1). It drives the
  // connector fill directly; its floored value is the active step (which
  // screenshot shows, which hex is "current").
  const [progress, setProgress] = useState(0);
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const active = Math.min(
    STEPS.length - 1,
    Math.floor(progress * STEPS.length),
  );

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const runway = runwayRef.current;
    if (!runway) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = runway.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      if (distance <= 0) return;
      // 0 when the section pins, 1 when the runway ends and it unpins.
      const next = Math.min(1, Math.max(0, -rect.top / distance));
      setProgress(next);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    // overflow="visible" is required: Section defaults to overflow-hidden,
    // and a hidden-overflow ancestor silently disables position:sticky — the
    // pinning would not work at all.
    <Section spacing="none" overflow="visible">
      {/* The runway: its extra height beyond one screen is the scroll
          distance the pinned content plays through — ~55vh per step. */}
      <div ref={runwayRef} className="lg:h-[265vh]">
        <div className="py-16 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:py-0">
          <Container>
            <SectionHeader
              title="Up and running in four steps"
              description="From install to insight in one evening — the app guides you through each step."
            />

            <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* left: shared cream panel — DESKTOP ONLY. Screenshots
                  crossfade as scroll changes the active step. Below lg there's
                  no scroll tracking, so this shared panel would freeze on step
                  1; the per-step images in the timeline take over instead. */}
              <div
                aria-hidden
                className="relative hidden h-135 overflow-hidden rounded-3xl bg-[#C7B7341A] lg:block"
              >
                {STEPS.map(({ image }, i) => (
                  <Image
                    key={i}
                    src={image}
                    alt=""
                    aria-hidden
                    fill
                    quality={85}
                    placeholder="blur"
                    sizes="320px"
                    className={`object-contain p-6 transition-opacity duration-500 motion-reduce:transition-none ${
                      i === active
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                    }`}
                  />
                ))}
              </div>

              {/* right: numbered timeline. On desktop scroll progress
                  highlights a step; on mobile every step shows its own
                  screenshot inline so the image always matches the copy. */}
              <ol className="m-0 list-none p-0">
                {STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    aria-current={i === active ? "step" : undefined}
                    className="relative pb-10 last:pb-0 lg:pb-9"
                  >
                    {/* connector doubling as a scroll-progress bar — desktop
                        only (on mobile the inline image sits between steps).
                        A grey dotted track with a yellow fill whose height
                        tracks how far scroll has moved through this segment. */}
                    {i < STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-8 top-15 hidden h-[calc(100%-4.25rem)] w-0 -translate-x-1/2 lg:block"
                      >
                        <span className="absolute inset-y-0 left-0 border-l-2 border-dotted border-border" />
                        {/* No CSS transition: the fill follows scroll frame by
                            frame, so any easing would only add lag. */}
                        <span
                          className="absolute left-0 top-0 border-l-2 border-dotted border-[#EFDF18]"
                          style={{
                            height: `${
                              Math.min(
                                1,
                                Math.max(0, progress * STEPS.length - i),
                              ) * 100
                            }%`,
                          }}
                        />
                      </span>
                    )}

                    <div className="flex items-start gap-6">
                      <svg
                        viewBox="0 0 100 86.6"
                        className="h-12 w-14 shrink-0 sm:h-13 sm:w-15"
                        aria-hidden
                      >
                        {/* Below lg every hex stays solid yellow (no scroll
                            tracking there); at lg+ a hex lights up once scroll
                            reaches it and stays lit — a cumulative progress
                            stepper that matches the connector fill. */}
                        <path
                          d={HEX_PATH}
                          className={`transition-[fill] duration-300 ${
                            progress * STEPS.length >= i
                              ? "fill-[#EFDF18]"
                              : "fill-[#EFDF18] lg:fill-[#F7F0CE]"
                          }`}
                        />
                        <text
                          x="50"
                          y="46"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="30"
                          fontWeight="800"
                          className={
                            progress * STEPS.length >= i
                              ? "fill-[#26272B]"
                              : "fill-[#26272B] lg:fill-[#BFAC2A]"
                          }
                        >
                          {String(i + 1).padStart(2, "0")}
                        </text>
                      </svg>
                      <div className="pt-0.5">
                        <h3 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">
                          {step.title}
                        </h3>
                        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* per-step screenshot — MOBILE ONLY. `display:none` at lg
                        means Next never downloads it on desktop, and the hidden
                        desktop panel never downloads on mobile. */}
                    <div
                      aria-hidden
                      className="relative mt-6 h-96 overflow-hidden rounded-3xl bg-[#F7F2E1] lg:hidden"
                    >
                      <Image
                        src={step.image}
                        alt=""
                        aria-hidden
                        fill
                        quality={85}
                        placeholder="blur"
                        sizes="(min-width: 640px) 400px, 90vw"
                        className="object-contain p-6"
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </div>
      </div>
    </Section>
  );
}
