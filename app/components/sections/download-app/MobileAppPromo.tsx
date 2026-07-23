import { AppImage as Image } from "@/app/components/ui/AppImage";
import AppStoreButton from "@/app/components/ui/AppStoreButton";
import GooglePlayButton from "@/app/components/ui/GooglePlayButton";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { Heading } from "@/app/components/ui/Typography";
import { APP_STORE_ID, PLAY_STORE_PACKAGE_NAME } from "@/app/lib/app-links";
// Placeholder — swap for the final App Store screenshot mockup when ready.
import phoneImg from "@/public/download-app/download_app-full.png";

/**
 * "Manage your energy on the go" — centered phone shot on the cream band
 * (the site's cream, #F7F2E1, with fixed dark text so it reads the same in
 * both themes), copy underneath, and both store badges. The badges render
 * inert "coming soon" until the listing URLs in app-links.ts go live.
 */
export default function MobileAppPromo() {
  return (
    <Section spacing="lg" surface="secondary">
      <Container className="flex flex-col items-center text-center">
        <Heading as="h2" variant="title" className="max-w-5xl text-[#26272B]">
          Manage your energy on the go with our mobile app
        </Heading>

        <Image
          src={phoneImg}
          alt="EnergieBee app in the App Store"
          quality={85}
          sizes="(min-width: 640px) 320px, 70vw"
          className="mt-10 w-56 sm:w-60 h-auto"
        />

        <div className="mt-10 max-w-2xl text-sm leading-relaxed text-[#3F4046] sm:text-base">
          <p>
            Stay on top of your energy account, payments, usage, EV charging and
            account health, all from one place.
          </p>
          <p className="mt-2">Already use MyAccount to manage your energy?</p>
          <p>
            Great! All you have to do is download the app and use the same login
            details.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <AppStoreButton appId={APP_STORE_ID} />
          <GooglePlayButton packageName={PLAY_STORE_PACKAGE_NAME} />
        </div>
      </Container>
    </Section>
  );
}
