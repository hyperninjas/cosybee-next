import { redirect } from "next/navigation";
import { getServerSession } from "@/app/lib/server-session";

/**
 * Post-login landing. One decision from the validated session, then a
 * redirect:
 *   • no session  → /login
 *   • banned      → /banned
 *   • must change password → /set-password
 *   • admin       → /admin
 *   • anyone else → home
 */
export default async function PostLoginPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { user } = session;
  if (user.banned) redirect("/banned");
  if (user.mustChangePassword) redirect("/set-password");
  redirect(user.role === "admin" ? "/admin" : "/");
}
