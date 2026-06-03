"use server";

import { redirect } from "next/navigation";
import { checkCredentials, createSession, destroySession } from "../lib/auth";

export type LoginState = { error?: string };

/** Validate credentials, start a session, and send the user on their way. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!checkCredentials(email, password)) {
    return { error: "Incorrect email or password." };
  }

  await createSession();

  // Only honour same-site admin paths from ?next= to avoid open redirects.
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

/** Clear the session and return to the login screen. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
