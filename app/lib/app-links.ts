/**
 * Store-listing identifiers for the EnergieBee mobile app — the ONE place
 * download links come from. Both stay `null` until the apps ship, and every
 * download surface (badges, device-aware CTAs) renders a "coming soon" state
 * automatically.
 *
 * These are IDENTIFIERS, not URLs — AppStoreButton/GooglePlayButton build the
 * listing URL from them. Passing a full URL produces a broken link (e.g.
 * `https://apps.apple.com/app/idhttps://apps.apple.com/...`) with no error, so
 * set exactly:
 *   NEXT_PUBLIC_APP_STORE_ID=6771356608                 ← bare numeric ID, no "id" prefix
 *   NEXT_PUBLIC_PLAY_STORE_PACKAGE_NAME=com.energiebee.app
 *
 * `NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so
 * changing them requires a rebuild (see the env note in next.config.ts). In
 * Docker they must be passed as `--build-arg`, not runtime env — see the ARG
 * block in the Dockerfile.
 */

/**
 * Blank → `null`, so "unset" and "set but empty" collapse to one value. Docker
 * makes this matter: `ENV FOO=$UNSET_ARG` writes an EMPTY STRING, not nothing,
 * so a build that forgets the `--build-arg` inlines `""` — which `?? null`
 * would sail straight past, leaving the declared `string | null` type lying
 * about the runtime value. Falsy checks would still work; a `!== null` check
 * would not, and would build `https://apps.apple.com/app/id`.
 */
function storeId(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Apple App Store ID — the digits after `id` in the listing URL. */
export const APP_STORE_ID: string | null = storeId(
  process.env.NEXT_PUBLIC_APP_STORE_ID,
);

/** Android application ID — the `?id=` query value in the Play listing URL. */
export const PLAY_STORE_PACKAGE_NAME: string | null = storeId(
  process.env.NEXT_PUBLIC_PLAY_STORE_PACKAGE_NAME,
);
