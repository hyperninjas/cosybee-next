"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Check if user has admin role
      if (data?.user?.role !== "admin") {
        await authClient.signOut();
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }

      // Redirect to the original destination or admin dashboard
      const redirect = searchParams.get("redirect") || "/admin";
      router.push(redirect);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-black">
          energiebee <span className="text-[#FF8A7A]">admin</span>
        </h1>
        <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Password reset successful. Please sign in with your new password.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8A7A] focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8A7A] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full p-3 bg-[#1b1b1b] text-white font-semibold rounded-lg hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </button>

      <div className="text-center">
        <Link
          href="/admin/forgot-password"
          className="text-sm text-[#FF8A7A] hover:underline"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          Loading...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
