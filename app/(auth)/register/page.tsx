import { redirect } from "next/navigation";

/**
 * No self-service sign-up: this app is the admin panel only, and members
 * register in their own app. Admin accounts are created from
 * /admin/manage-users. Kept as a redirect so old links land on sign-in
 * instead of a 404.
 */
export default function RegisterPage() {
  redirect("/login");
}
