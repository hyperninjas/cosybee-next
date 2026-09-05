import { getImageProps, type StaticImageData } from "next/image";

/**
 * Where the mobile crop hands over to the desktop one — Tailwind's `sm`
 * (40rem = 640px), which is the breakpoint the old `sm:hidden` / `hidden
 * sm:block` pair used. ONE constant feeds both the `<source media>` and the
 * matching preload hint: if those two ever disagreed the browser would fetch
 * both crops again, which is the whole bug this component exists to fix.
 */
const SM_BREAKPOINT_PX = 640;
const DESKTOP_MEDIA = `(min-width: ${SM_BREAKPOINT_PX}px)`;
const MOBILE_MEDIA = `(max-width: ${SM_BREAKPOINT_PX - 0.02}px)`;

type Props = {
  /** Full-bleed cover. Static import so intrinsic size + blur are known. */
  image: StaticImageData;
  /** Optional portrait crop for phones. Art direction, not a size hack. */
  imageMobile?: StaticImageData;
  /** Decorative by default; pass a value only when the photo carries meaning. */
  alt?: string;
};

/**
 * The full-bleed background photo behind a dark hero.
 *
 * WHY `<picture>` AND NOT TWO `<Image>`s. The obvious way to art-direct is to
 * render both crops and hide one with `sm:hidden` / `hidden sm:block`. That
 * renders correctly and loads terribly: CSS `display:none` does not stop an
 * `<img>` from downloading, and marking both `priority` emitted a
 * `<link rel="preload">` for each, so EVERY visitor fetched both crops at
 * highest priority and the wasted one competed with the LCP image for
 * bandwidth. On /hive that was an extra 50KB fetched before anything else,
 * on a desktop that never displays it.
 *
 * `<picture>` + `<source media>` is the browser's own mechanism for this: it
 * evaluates the media query first and downloads exactly one candidate. Next's
 * own docs recommend it for art direction, via `getImageProps`.
 *
 * TRADE-OFF: `getImageProps` cannot carry `placeholder="blur"` (the placeholder
 * would never be removed), so the blur-up is painted as a background on the
 * wrapper instead, where the photo simply covers it. Same effect, and it
 * outlives the load harmlessly because these covers are opaque.
 */
export default function HeroBackground({ image, imageMobile, alt = "" }: Props) {
  // `fill` gives us the absolute inset-0 style; eager + high priority because
  // this is the LCP element on every page that uses it.
  const common = {
    alt,
    fill: true,
    sizes: "100vw",
    quality: 85,
    loading: "eager" as const,
    fetchPriority: "high" as const,
  };

  const { props: desktop } = getImageProps({ ...common, src: image });
  const { props: mobile } = imageMobile
    ? getImageProps({ ...common, src: imageMobile })
    : { props: null };

  // The <img> is the fallback, so it carries the crop that applies when no
  // <source> matches — the mobile one when there is a mobile crop.
  const fallback = mobile ?? desktop;

  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-20 bg-cover bg-center"
      style={{ backgroundImage: `url(${image.blurDataURL})` }}
    >
      <picture>
        {mobile && (
          <source
            media={DESKTOP_MEDIA}
            srcSet={desktop.srcSet}
            sizes={desktop.sizes}
          />
        )}
        {/* A raw <img> is required here, not <Image>: only `getImageProps` can
            feed a <picture>, which is what makes the browser pick ONE crop.
            `alt` is repeated after the spread so the a11y lint can see it. */}
        <img {...fallback} alt={alt} className="object-cover object-center" />
      </picture>
      {mobile && (
        <>
          {/* Preload the crop this viewport will actually use, so the fetch
              starts before the parser reaches the <picture>. `media` keeps it
              to one — the pair mirrors the <source> above exactly. */}
          <link
            rel="preload"
            as="image"
            media={DESKTOP_MEDIA}
            imageSrcSet={desktop.srcSet}
            imageSizes={desktop.sizes}
          />
          <link
            rel="preload"
            as="image"
            media={MOBILE_MEDIA}
            imageSrcSet={mobile.srcSet}
            imageSizes={mobile.sizes}
          />
        </>
      )}
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/40 h-full" />
    </div>
  );
}
