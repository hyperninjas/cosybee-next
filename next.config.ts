import type { NextConfig } from "next";

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
    qualities: [75, 85],
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
    compilationMode: 'all',
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
      { source: "/energy-monitoring-commercial", destination: "/energy", permanent: true },
      { source: "/energy-monitoring-industrial", destination: "/energy", permanent: true },
      { source: "/monitoring-matters", destination: "/energy", permanent: true },
      { source: "/real-time-reporting-commercial", destination: "/energy", permanent: true },
      { source: "/real-time-reporting-industrial", destination: "/energy", permanent: true },
      { source: "/knocking-down-barriers", destination: "/hive", permanent: true },
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
        ],
      },
      {
        // Keep the admin panel (dashboard, create/edit/list) out of every
        // search index. This HTTP-level directive backs up the `noindex`
        // meta tag in app/admin/layout.tsx and applies to all response types,
        // including redirects and non-HTML responses.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // `:path*` above doesn't match the bare /admin route — cover it too.
        source: "/admin",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
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
