import { AppImage as Image } from "@/app/components/ui/AppImage";
import AppStoreButton from "@/app/components/ui/AppStoreButton";
import GooglePlayButton from "@/app/components/ui/GooglePlayButton";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { Heading } from "@/app/components/ui/Typography";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/app/lib/app-links";
// Placeholders — swap for the final app screenshots when ready.
import frontImg from "@/public/download/energiebee_app_download.png";
// import backLeftImg from "@/public/download/connect_home-full.png";
// import backRightImg from "@/public/download/create_account-full.png";

/**
 * "Manage your energy on the go", v2 — two-column layout: a fanned cluster of
 * three app screens on the left, copy + store badges on the right (stacks with
 * the cluster on top below lg). The back two phones are offset, rotated and
 * scaled down for depth; the front one carries the drop shadow. Cream band
 * with fixed dark text so it reads the same in both themes; badges render
 * inert "coming soon" until the URLs in app-links.ts go live.
 */
export default function MobileAppPromoV2() {
  return (
    <Section spacing="lg" surface="tertiary">
      <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* left: composite two-phone app image, filling the column */}
        <Image
          src={frontImg}
          alt="EnergieBee app shown on two phones"
          // 90 is the max in next.config's `qualities` list; 100 isn't allowed.
          quality={90}
          placeholder="blur"
          // Full-column width per breakpoint: ~1 column of the max-w-6xl grid
          // on lg, near-viewport-width single column below it. Match these to
          // the real render or Next under-serves and the image softens.
          sizes="(min-width: 1024px) 560px, 92vw"
          className="h-auto w-full"
        />

        {/* right: copy + badges */}
        <div className="text-center lg:text-left">
          <Heading as="h2" variant="title" className="max-w-xl text-[#26272B]">
            Manage your energy on the go with our mobile app
          </Heading>

          <div className="mt-6 max-w-xl text-sm leading-relaxed text-[#3F4046] sm:text-base">
            <p>
              Stay on top of your energy account, payments, usage, EV charging
              and account health, all from one place.
            </p>
            <p className="mt-2">Already use MyAccount to manage your energy?</p>
            <p>
              Great! All you have to do is download the app and use the same
              login details.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <AppStoreButton href={APP_STORE_URL} />
            <GooglePlayButton href={PLAY_STORE_URL} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
