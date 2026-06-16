# syntax=docker/dockerfile:1

# Multi-stage build for the EnergieBee Next.js app (output: "standalone").
# The final image ships only the traced server + node_modules, plus the
# static assets and public/ folder copied in by hand (we serve them from the
# container, not a CDN).

# ---- Base -------------------------------------------------------------------
FROM node:22-alpine AS base
# libc6-compat: sharp (Next image optimization) needs it on Alpine/musl.
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Dependencies (cached unless lockfile changes) --------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----------------------------------------------------------------
FROM base AS builder
ENV NODE_ENV=production

# Public-facing values that get inlined into the client bundle at build time.
# Override at build: `docker build --build-arg NEXT_PUBLIC_SITE_URL=...`.
ARG NEXT_PUBLIC_SITE_URL=https://energiebee.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Better Auth backend URL for client-side auth requests.
ARG NEXT_PUBLIC_AUTH_URL=https://api.energiebee.com
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
# Backend API used during prerender (generateStaticParams / sitemap). If
# unreachable at build time the app falls back gracefully and renders those
# pages on demand at runtime instead.
ARG API_URL=https://api.energiebee.com
ENV API_URL=$API_URL
# Google reCAPTCHA v3 public site key — inlined into the client bundle, so it
# MUST be passed at build time (a runtime env var is too late). Without it the
# forms submit without a token and the server skips verification. Pass the real
# value as a build arg in Dokploy / `docker build --build-arg ...`. The SECRET
# key (RECAPTCHA_SECRET_KEY) is read server-side at runtime — set it as a normal
# runtime env var, not here.
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcmPiItAAAAAE5uDGIHnes3xqU85BigNkL4cu_z
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runner (minimal runtime image) -----------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# The standalone output: server.js + the minimal traced node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets and public/ are NOT included in standalone — copy them in so
# server.js can serve /_next/static and /public (no CDN in use).
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Liveness check against the static home page.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
