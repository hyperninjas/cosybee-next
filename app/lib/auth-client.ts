import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
  twoFactorClient,
  emailOTPClient,
} from "better-auth/client/plugins";

// Use same-origin proxy to avoid cross-origin cookie issues
// The /api/auth/* routes proxy to the backend API
export const authClient = createAuthClient({
  baseURL: "",  // Same-origin - proxied through /api/auth/*
  plugins: [
    adminClient(),
    organizationClient(),
    twoFactorClient(),
    emailOTPClient(),
  ],
});

export const { useSession, signIn, signOut } = authClient;
