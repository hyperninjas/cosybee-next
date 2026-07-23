/**
 * Store-listing URLs for the EnergieBee mobile app — the ONE place download
 * links live. Both stay `null` until the apps ship, and every download surface
 * (badges, device-aware CTAs) renders a "coming soon" state automatically.
 *
 * At launch, set the env vars (or replace the fallbacks here) with the real
 * listing URLs, e.g.
 *   NEXT_PUBLIC_APP_STORE_ID=https://apps.apple.com/gb/app/energiebee/id123456789
 *   NEXT_PUBLIC_PLAY_STORE_PACKAGE_NAME=https://play.google.com/store/apps/details?id=com.energiebee.app
 *
 * `NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so
 * changing them requires a rebuild (see the env note in next.config.ts).
 */

export const APP_STORE_ID: string | null =
  process.env.NEXT_PUBLIC_APP_STORE_ID ?? null;

export const PLAY_STORE_PACKAGE_NAME: string | null =
  process.env.NEXT_PUBLIC_PLAY_STORE_PACKAGE_NAME ?? null;
