import { AppImage as Image } from "@/app/components/ui/AppImage";
import AppStoreButton from "@/app/components/ui/AppStoreButton";
import GooglePlayButton from "@/app/components/ui/GooglePlayButton";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { Heading } from "@/app/components/ui/Typography";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/app/lib/app-links";
// Placeholders — swap for the final app screenshots when ready.
import frontImg from "@/public/download/app_home-full.png";
import backLeftImg from "@/public/download/connect_home-full.png";
import backRightImg from "@/public/download/create_account-full.png";

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
        {/* left: fanned three-phone cluster */}
        <div className="flex justify-center">
          <div
            aria-hidden
            className="relative mx-auto flex h-95 w-full max-w-md items-center justify-center sm:h-110 lg:mx-0"
          >
            {/* back-left screen — rotated out and tucked behind */}
            <Image
              src={backLeftImg}
              alt=""
              aria-hidden
              quality={85}
              placeholder="blur"
              sizes="180px"
              className="absolute left-[6%] top-1/2 w-36 -translate-y-1/2 rotate-[-8deg] drop-shadow-xl sm:w-44"
            />
            {/* back-right screen — mirrored to the other side */}
            <Image
              src={backRightImg}
              alt=""
              aria-hidden
              quality={85}
              placeholder="blur"
              sizes="180px"
              className="absolute right-[6%] top-1/2 w-36 -translate-y-1/2 rotate-[8deg] drop-shadow-xl sm:w-44"
            />
            {/* front screen — the dashboard, sitting proud of the cluster */}
            <Image
              src={frontImg}
              alt="EnergieBee app dashboard"
              quality={90}
              placeholder="blur"
              sizes="(min-width: 640px) 240px, 200px"
              className="relative z-10 w-48 drop-shadow-2xl sm:w-56"
            />
          </div>
        </div>

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
