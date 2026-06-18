import type { NextConfig } from "next";

// Serve the site on ONE hostname only. Both www and non-www resolving splits
// ranking signals (duplicate content), so we 301 www → non-www to match the
// canonical URLs (SITE_URL = https://energiebee.com in app/lib/site.ts).
// To make www the canonical host instead, swap these two values.
const CANONICAL_HOST = "energiebee.com";
const REDIRECT_FROM_HOST = `www.${CANONICAL_HOST}`;

// Content-Security-Policy, REPORT-ONLY for now. Report-only never blocks a
// request — the browser only logs violations to the console — so shipping this
// can't break the site. Watch the violation reports for a release or two, fix
// any legitimate sources it flags, then promote it to the enforcing
// `Content-Security-Policy` header. `'unsafe-inline'` is required for script
// because we ship a handful of inline scripts (scroll restoration, JSON-LD,
// next-themes, gtag bootstrap) and don't yet use per-request nonces — tighten
// to a nonce strategy when promoting to enforcing.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://app.consently.net https://www.google.com https://www.gstatic.com https://www.googletagmanager.com",
  "img-src 'self' data: blob: https://eb-api.technext.it https://energiebee.s3.eu-west-2.amazonaws.com https://www.google.com https://www.googletagmanager.com https://*.google-analytics.com",
  "connect-src 'self' https://app.consently.net https://www.google.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://eb-api.technext.it",
  "frame-src https://www.google.com https://app.consently.net",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  // Generate unique build ID for each deployment to help with Server Action cache invalidation
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Keep these out of the bundler so they load as normal Node modules:
  // BlockNote's server renderer pulls in React client APIs (createContext)
  // that can't be evaluated under the RSC "react-server" condition, and
  // better-sqlite3 is a native addon.
  serverExternalPackages: [
    "@blocknote/server-util",
    "@blocknote/core",
    "@blocknote/react",
    "@prisma/adapter-libsql",
    "@libsql/client",
    "sharp",
  ],
  // Strip console.* (except errors) from production builds — small bytes
  // saved, plus removes leaked dev logs.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  // Image pipeline — modern formats only, tighter size ladder than the
  // default (which goes up to 3840px and is overkill for our largest crop).
  images: {
    // Optimization is ON: local /public images (heroes, device shots — the LCP
    // images) are resized and served as AVIF/WebP. Remote API images (eb-api)
    // are rendered with the per-<Image unoptimized> prop where they appear,
    // since that host can resolve to a private IP that Next blocks from
    // server-side fetching.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Allowed `quality` values. 85 = the sweet spot for photos (sharp, but
    // far smaller than 100); 75 is Next's default, used by any <Image> without
    // an explicit quality prop. Next converts to AVIF/WebP and resizes per the
    // size ladders above.
    qualities: [75, 85, 90],
    // Allow external images from the backend API and S3
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eb-api.technext.it",
        pathname: "/api/media/**",
      },
      {
        protocol: "https",
        hostname: "energiebee.s3.eu-west-2.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  reactCompiler: {
    compilationMode: "all",
  },
  env: {
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,

    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,

    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET: process.env.AWS_BUCKET,

    // Public reCAPTCHA v3 site key (build-time inlined into the client bundle).
    // The SECRET (RECAPTCHA_SECRET_KEY) is intentionally NOT here — it's read
    // server-side at runtime in the form actions, so it never enters the build.
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,

    GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
    BING_SITE_VERIFICATION: process.env.BING_SITE_VERIFICATION,

    // GA4 measurement ID (e.g. "G-XXXXXXXXXX"). Public so it can be inlined for
    // the client-side gtag bootstrap. Analytics is a no-op until this is set,
    // so leaving it unset in dev/staging keeps those environments tracking-free.
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },

  experimental: {
    // Inline above-the-fold critical CSS to reduce the render-blocking
    // CSS request on first paint. Uses Beasties (formerly Critters) under
    // the hood. Falls back gracefully if the optimiser can't run.
    optimizeCss: true,

    // Cover-image uploads go through a Server Action (multipart POST).
    // The default body limit is 1MB — too small for real photos, which
    // caused 400 / connection-reset errors on save. Allow up to 10MB.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // No client-side source maps in production — they're large and only useful
  // when debugging deployed errors via a remote SDK.
  productionBrowserSourceMaps: false,
  compress: true,

  async redirects() {
    // Legacy URLs from the previous site that Google still has indexed and
    // sends traffic to. `permanent: true` = 308 (the search-engine equivalent
    // of a 301), so each old page's ranking signal transfers to the closest
    // matching page here and the 404s clear.
    return [
      // Host canonicalisation: 301 every www request to the bare domain so
      // www and non-www don't serve duplicate content. Runs before the legacy
      // path redirects below.
      {
        source: "/:path*",
        has: [{ type: "host", value: REDIRECT_FROM_HOST }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
      {
        source: "/energy-monitoring-domestic",
        destination: "/energy",
        permanent: true,
      },
      {
        source: "/energy-management-domestic",
        destination: "/energy",
        permanent: true,
      },
      {
        // No commercial offering on the new site — point at the closest page.
        source: "/energy-management-commercial",
        destination: "/energy",
        permanent: true,
      },
      {
        source: "/online-home-hub-domestic",
        destination: "/smart",
        permanent: true,
      },
      {
        // Old WordPress author archive — send to the blog.
        source: "/author/admin",
        destination: "/hive",
        permanent: true,
      },

      // Second batch of legacy 404s (from the Semrush crawl). The
      // monitoring/management/reporting/control pages map to the energy hub;
      // the brand-story page goes to the blog.
      { source: "/control-matters", destination: "/energy", permanent: true },
      { source: "/energy-management", destination: "/energy", permanent: true },
      {
        source: "/energy-monitoring-commercial",
        destination: "/energy",
        permanent: true,
      },
      {
        source: "/energy-monitoring-industrial",
        destination: "/energy",
        permanent: true,
      },
      {
        source: "/monitoring-matters",
        destination: "/energy",
        permanent: true,
      },
      {
        source: "/real-time-reporting-commercial",
        destination: "/energy",
        permanent: true,
      },
      {
        source: "/real-time-reporting-industrial",
        destination: "/energy",
        permanent: true,
      },
      {
        source: "/knocking-down-barriers",
        destination: "/hive",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        // Baseline hardening for every route.
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS: force HTTPS for two years, cover subdomains, and opt into the
          // browser preload list. Safe here because the canonical site and its
          // subdomains are HTTPS-only. To back out of `preload` later you must
          // also remove the domain from hstspreload.org, so only ship this once
          // every *.energiebee.com host is confirmed HTTPS.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // CSP in report-only mode — logs violations without blocking. See the
          // CSP_REPORT_ONLY note above before promoting to enforcing.
          {
            key: "Content-Security-Policy-Report-Only",
            value: CSP_REPORT_ONLY,
          },
        ],
      },
      {
        // Keep the admin panel (dashboard, create/edit/list) out of every
        // search index. This HTTP-level directive backs up the `noindex`
        // meta tag in app/admin/layout.tsx and applies to all response types,
        // including redirects and non-HTML responses.
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // `:path*` above doesn't match the bare /admin route — cover it too.
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Keep the member account section (profile, security, etc.) out of
        // every search index. Backs up the `noindex` meta tag in
        // app/(private)/account/layout.tsx at the HTTP level, covering
        // redirects and non-HTML responses.
        source: "/account/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // `:path*` above doesn't match the bare /account route — cover it too.
        source: "/account",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // The service worker must never be HTTP-cached, otherwise browsers
        // can keep serving a stale worker and updates won't roll out.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
