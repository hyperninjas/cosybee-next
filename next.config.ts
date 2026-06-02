import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

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
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    qualities: [50, 65, 75, 85],
    // Allow external images from the backend API
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eb-api.technext.it",
        pathname: "/api/media/**",
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
};

export default nextConfig;
