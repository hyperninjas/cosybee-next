import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";

/**
 * better-auth client.
 *
 * Uses the same-origin proxy (`/api/auth/*` → backend) to keep the session
 * cookie first-party — do NOT switch to a cross-origin `baseURL` +
 * `credentials:"include"`.
 *
 * `inferAdditionalFields` types the extra user columns the backend returns
 * (the auth server is external so its type can't be imported — we declare the
 * fields explicitly). A global `onError` signs out + redirects if the account
 * is banned mid-session, on ANY auth request.
 */
export const authClient = createAuthClient({
  baseURL: "", // Same-origin — proxied through /api/auth/*
  fetchOptions: {
    onError(ctx) {
      const code = (ctx.error as { code?: string } | undefined)?.code;
      if (code === "ACCOUNT_BANNED") {
        authClient.signOut().finally(() => {
          if (typeof window !== "undefined") window.location.assign("/banned");
        });
      }
    },
  },
  plugins: [
    adminClient(),
    organizationClient(),
    twoFactorClient(),
    emailOTPClient(),
    inferAdditionalFields({
      user: {
        // Backend-managed extras: `required: false` so they're typed on the
        // session user without becoming required sign-up / update-user input.
        isOnboardingDone: { type: "boolean", required: false, input: false },
        onboardingStatus: { type: "string", required: false, input: false },
        location: { type: "string", required: false, input: false },
        postcode: { type: "string", required: false, input: false },
        homeName: { type: "string", required: false, input: false },
        houseId: { type: "string", required: false, input: false },
      },
    }),
  ],
});

export const { useSession, signIn, signOut } = authClient;
