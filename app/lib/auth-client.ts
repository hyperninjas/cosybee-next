import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  emailOTPClient,
} from "better-auth/client/plugins";

// Use NEXT_PUBLIC_AUTH_URL for the backend API
// Local: http://localhost:3000
// Production: https://api.energiebee.com
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
  plugins: [
    adminClient(),
    organizationClient(),
    twoFactorClient(),
    emailOTPClient(),
  ],
});

export const { useSession, signIn, signOut } = authClient;
