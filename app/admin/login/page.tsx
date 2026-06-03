import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "../lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  // Already signed in? Skip the form.
  if (await isAuthenticated()) {
    redirect("/admin");
  }

  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)]">
        <h1 className="text-xl font-extrabold text-black">
          energiebee <span className="text-[#FF8A7A]">admin</span>
        </h1>
        <p className="mt-1 text-sm text-[#545454]">
          Sign in to manage the blog.
        </p>
        <div className="mt-6">
          <LoginForm next={nextPath} />
        </div>
      </div>
    </div>
  );
}
