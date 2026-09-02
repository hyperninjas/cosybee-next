import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/app/lib/server-session";
import { SetPasswordForm } from "./SetPasswordForm";
import { LogoutButton } from "@/app/components/account/LogoutButton";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

/**
 * Forced password change for an admin-provisioned account.
 *
 * Reached only by redirect from `requireUser` / `requireAdmin`, which bounce
 * anyone carrying `mustChangePassword` here. This page deliberately calls
 * `getServerSession` instead of those helpers: going through them would
 * redirect this page to itself forever.
 */
export default async function SetPasswordPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/set-password");
  if (session.user.banned) redirect("/banned");
  // Where this user belongs once the flag is gone. Resolved here, on the
  // server, so the form can navigate straight there.
  const destination = session.user.role === "admin" ? "/admin" : "/";

  // Nothing to force — either they already changed it, or they never had to.
  // Deliberately NOT /post-login: that page decides where to go from the
  // CLIENT session store, so pointing at it from here makes two pages that can
  // redirect to each other, and a single stale read on either side becomes an
  // infinite bounce. Send them to a terminal route instead.
  if (!session.user.mustChangePassword) redirect(destination);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">
            Set your own password
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your account was created for you and the password was sent by
            email, so it needs replacing before you can go any further.
          </p>
        </header>
        <SetPasswordForm email={session.user.email} destination={destination} />
        {/* Every other route is gated behind this page, so without a sign-out
            the user would have nowhere to go but here. */}
        <div className="mt-4 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
