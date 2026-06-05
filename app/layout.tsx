import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import InstallPrompt from "./components/InstallPrompt";
import {
  ORG_ADDRESS,
  ORG_CONTACT_EMAIL,
  ORG_LEGAL_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SOCIAL,
  url,
} from "./lib/site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Site-wide metadata. Per-page metadata exports inherit and override
 * individual fields. `title.template` automatically suffixes child page
 * titles with the brand name.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: ORG_LEGAL_NAME, url: SITE_URL }],
  creator: ORG_LEGAL_NAME,
  publisher: ORG_LEGAL_NAME,
  category: "technology",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: "/",
    // Let feed readers and crawlers discover the blog RSS feed.
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: `${SITE_NAME} — Blog` }],
    },
  },
  // Search-engine site verification. Tokens are read from server env so they
  // can differ per environment and aren't committed. Undefined values are
  // omitted by Next, so this is a no-op until the tokens are set.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
      : {}),
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    // Next.js auto-injects /opengraph-image.{png,tsx} sitting at app/ root,
    // but listing it here also surfaces it for crawlers that probe metadata.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    creator: "@EnergieBee",
    site: "@EnergieBee",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // icons / manifest links are auto-injected by Next from app/icon.tsx,
  // app/apple-icon.tsx, and app/manifest.ts — no need to repeat them here.
  referrer: "origin-when-cross-origin",
};

/**
 * Theme + responsive viewport. `themeColor` lives here (not in metadata)
 * as of Next.js 16. Two themes: black for the dark navbar / hero, white
 * for the rest of the page.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/** Organization schema (JSON-LD) for rich results in search. */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: ORG_LEGAL_NAME,
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: url("/icon"),
  description: SITE_DESCRIPTION,
  email: ORG_CONTACT_EMAIL,
  address: {
    "@type": "PostalAddress",
    streetAddress: ORG_ADDRESS.street,
    addressLocality: ORG_ADDRESS.city,
    addressRegion: ORG_ADDRESS.region,
    postalCode: ORG_ADDRESS.postalCode,
    addressCountry: ORG_ADDRESS.country,
  },
  sameAs: Object.values(SOCIAL),
};

/** Website schema with SearchAction — helps Google show a sitelinks
 *  search box for the brand. */
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: url("/search?q={search_term_string}"),
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        {/* Manual scroll restoration. On reload we save the previous
         *  scroll position to sessionStorage and restore it instantly
         *  once the document is tall enough — avoids both the "jumps to
         *  top" issue (browser can't restore past initial document
         *  height) and the smooth-scroll-animates-restoration issue. We
         *  then enable `scroll-smooth` for subsequent anchor clicks. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  if(!('scrollRestoration' in history))return;
  var k='sy:'+location.pathname+location.search;
  history.scrollRestoration='manual';
  var save=function(){try{sessionStorage.setItem(k,String(window.scrollY));}catch(e){}};
  addEventListener('pagehide',save);
  addEventListener('beforeunload',save);
  var raw;try{raw=sessionStorage.getItem(k);}catch(e){}
  var enableSmooth=function(){document.documentElement.classList.add('scroll-smooth');};
  if(raw===null){enableSmooth();return;}
  var y=parseInt(raw,10);
  if(!y||y<0){enableSmooth();return;}
  var tries=0;
  var step=function(){
    var max=document.documentElement.scrollHeight-window.innerHeight;
    if(max>=y){window.scrollTo({top:y,left:0,behavior:'instant'});enableSmooth();return;}
    if(++tries>120){window.scrollTo({top:y,left:0,behavior:'instant'});enableSmooth();return;}
    requestAnimationFrame(step);
  };
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){requestAnimationFrame(step);});
  }else{requestAnimationFrame(step);}
})();
`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
        <Footer />
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
