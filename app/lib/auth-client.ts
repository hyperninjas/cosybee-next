import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  emailOTPClient,
} from "better-auth/client/plugins";

// Direct connection to backend API for production
// Backend has CORS configured for https://energiebee.com
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "https://eb-api.technext.it",
  plugins: [
    adminClient(),
    organizationClient(),
    twoFactorClient(),
    emailOTPClient(),
  ],
});

export const { useSession, signIn, signOut } = authClient;
