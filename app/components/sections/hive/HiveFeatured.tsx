"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import Avatar from "../../ui/Avatar";
import { CtaButton } from "../../ui/Cta";
import { getFeaturedArticles, type HiveArticle } from "@/app/lib/hive-articles";
import Dot from "../../ui/Dot";

const SLIDES: HiveArticle[] = getFeaturedArticles();

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-5 w-5 ${className}`}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-5 w-5 ${className}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Slide({ slide, priority }: { slide: HiveArticle; priority: boolean }) {
  return (
    <article className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-[1fr_1fr]">
      <div className="relative aspect-4/3 lg:aspect-auto lg:h-full">
        <Image
          src={slide.image}
          alt={slide.imageAlt}
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover"
          priority={priority}
        />
      </div>
      <div className="flex flex-col h-full p-8 sm:p-10">
        <div className="flex items-center gap-4 text-base">
          <span className="font-semibold text-[#EE3D1A]">{slide.category}</span>
          <Dot />
          <span className="text-[#545454] text-[15px] font-medium">
            {slide.readTime}
          </span>
        </div>
        <h2
          title={slide.title}
          className="text-2xl line-clamp-1 tracking-[-0.03em] font-extrabold text-black sm:text-3xl lg:text-[40px] mt-3"
        >
          {slide.title}
        </h2>
        {slide.carouselIntro && (
          <p className="text-[#545454] mt-4">{slide.carouselIntro}</p>
        )}
        {slide.carouselBody && (
          <p className="text-base text-[#545454] mt-4 line-clamp-3">
            {slide.carouselBody}
          </p>
        )}
        <div className="flex items-center gap-3 mt-4">
          <Avatar name={slide.author.name} />
          <div className="text-base">
            <div className="font-bold text-black text-lg">
              {slide.author.name}
            </div>
            <div className="text-[#545454] mt-1 font-medium text-[15px]">
              {slide.author.date}
            </div>
          </div>
        </div>
        <CtaButton
          href={`/hive/${slide.slug}`}
          size="md"
          className="mt-8 w-full font-semibold text-lg! h-13.25!"
        >
          Read Article
        </CtaButton>
      </div>
    </article>
  );
}

/**
 * Featured-article carousel powered by Embla Carousel v9. Slides come
 * from `getFeaturedArticles()` (articles flagged with `carouselIntro`
 * / `carouselBody`). Supports drag/swipe out of the box, plus arrows
 * and clickable dots wired to the Embla API.
 *
 * Note: useEmblaCarousel returns a 3-tuple in v9 — [rootRef, api, apiSync].
 * The 2nd element is `undefined` until the carousel mounts; the 3rd is
 * the always-defined synchronous handle. We use the 2nd here so calls
 * naturally no-op pre-mount via optional chaining.
 */
export default function HiveFeatured() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.goToPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.goToNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.goTo(i), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reinit", onSelect);
  }, [emblaApi]);

  if (SLIDES.length === 0) return null;

  return (
    <section className="mx-auto max-w-360 px-6 py-12 sm:px-10 lg:px-30">
      {/* embla viewport */}
      <div
        className="overflow-hidden border border-[#F6F6F6] rounded-2xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]"
        ref={emblaRef}
      >
        <div className="flex touch-pan-y">
          {SLIDES.map((s, i) => (
            <div
              key={s.slug}
              className="min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
            >
              <Slide slide={s} priority={i === 0} />
            </div>
          ))}
        </div>
      </div>

      {/* pagination row */}
      <div className="mt-8 relative h-13 flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center">
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Featured article slides"
          >
            {SLIDES.map((s, i) => {
              const isActive = i === selectedIndex;
              return (
                <button
                  key={s.slug}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => scrollTo(i)}
                  className={`h-2 rounded-full transition-all ${
                    isActive
                      ? "w-2 bg-black"
                      : "w-2 bg-[#1F1F1F29] hover:bg-neutral-400"
                  }`}
                />
              );
            })}
          </div>
        </div>
        <div className="flex absolute right-0 items-center gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={scrollPrev}
            className="flex h-13 w-13 items-center justify-center rounded-lg border border-[#F6F6F6] bg-white text-black shadow-[0_2.88px_5.32px_0_rgba(0,0,0,0.02),0_12.58px_17.87px_0_rgba(0,0,0,0.04),0_24px_40px_0_rgba(0,0,0,0.07)] transition-colors hover:bg-neutral-50"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={scrollNext}
            className="flex h-13 w-13 items-center justify-center rounded-lg border border-[#F6F6F6] bg-white text-black shadow-[0_2.88px_5.32px_0_rgba(0,0,0,0.02),0_12.58px_17.87px_0_rgba(0,0,0,0.04),0_24px_40px_0_rgba(0,0,0,0.07)] transition-colors hover:bg-neutral-50"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
