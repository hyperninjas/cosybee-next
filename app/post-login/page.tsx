import { redirect } from "next/navigation";
import { getServerSession } from "@/app/lib/server-session";
import { SignOutNonAdmin } from "./SignOutNonAdmin";

/**
 * Post-login landing. This app is the admin panel only — members have their
 * own app — so there is one real destination:
 *   • no session  → /login
 *   • banned      → /banned
 *   • not admin   → signed out, then /login?error=admin-only
 *   • must change password → /set-password
 *   • admin       → /admin
 *
 * It's also where the server gates (`requireAdmin`, /set-password) send any
 * member session they come across. The /api/auth proxy already refuses member
 * sign-ins, so reaching the sign-out branch means a session that predates that
 * rule or arrived another way (e.g. an OAuth callback that bypassed the proxy).
 */
export default async function PostLoginPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { user } = session;
  if (user.banned) redirect("/banned");
  // Signing out has to happen in the browser: better-auth clears its cookies
  // on the sign-out response, which a server component can't hand back.
  if (user.role !== "admin") return <SignOutNonAdmin />;
  if (user.mustChangePassword) redirect("/set-password");
  redirect("/admin");
}
