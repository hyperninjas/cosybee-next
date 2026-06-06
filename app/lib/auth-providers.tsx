import type { ReactNode } from "react";

/**
 * Social sign-in providers shown on the login & register pages.
 *
 * These call `authClient.signIn.social({ provider })`, which only works if the
 * EXTERNAL better-auth server has the matching provider configured (client id/
 * secret + redirect URI). Add a provider here once the backend supports it —
 * the UI renders whatever is in `SOCIAL_PROVIDERS` and degrades gracefully if
 * the backend rejects it.
 */
export type SocialProviderId = "google" | "apple" | "github";

export interface SocialProvider {
  id: SocialProviderId;
  label: string;
  icon: ReactNode;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.36 12.78c.02 2.5 2.2 3.33 2.22 3.34-.02.06-.35 1.2-1.15 2.37-.69 1.02-1.41 2.03-2.55 2.05-1.11.02-1.47-.66-2.75-.66-1.27 0-1.67.64-2.73.68-1.09.04-1.93-1.1-2.63-2.11-1.43-2.08-2.52-5.87-1.05-8.43.73-1.27 2.03-2.07 3.45-2.1 1.08-.02 2.09.72 2.75.72.66 0 1.89-.9 3.19-.77.54.02 2.07.22 3.05 1.65-.08.05-1.82 1.07-1.8 3.19M14.23 4.5c.58-.71.98-1.69.87-2.67-.84.03-1.86.56-2.47 1.26-.54.62-1.02 1.62-.89 2.58.94.07 1.9-.47 2.49-1.17" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 1.5A10.5 10.5 0 0 0 8.68 22a.55.55 0 0 0 .73-.53v-1.86c-2.92.63-3.54-1.41-3.54-1.41-.48-1.21-1.17-1.54-1.17-1.54-.95-.65.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.41-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.88 1.07a10 10 0 0 1 5.24 0c2-1.35 2.88-1.07 2.88-1.07.57 1.45.21 2.52.1 2.79.67.74 1.08 1.67 1.08 2.82 0 4.02-2.45 4.9-4.79 5.16.38.33.71.97.71 1.96v2.9c0 .29.19.62.74.52A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  );
}

/**
 * Edit this list to control which social buttons appear. Default: Google only.
 * Uncomment Apple / GitHub once they're enabled on the auth server.
 */
export const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: "google", label: "Continue with Google", icon: <GoogleIcon /> },
  // { id: "apple", label: "Continue with Apple", icon: <AppleIcon /> },
  // { id: "github", label: "Continue with GitHub", icon: <GitHubIcon /> },
];

// Keep the unused icon components referenced so they stay available for the
// commented-out providers above without tripping the linter.
export const SOCIAL_ICONS = { AppleIcon, GitHubIcon };
