"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Input, Spinner } from "@heroui/react";
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
        <Alert status="success">
          <Alert.Description>
            Password reset successful. Please sign in with your new password.
          </Alert.Description>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#333]">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#333]">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      )}

      <Button type="submit" variant="secondary" fullWidth isDisabled={loading}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" /> Signing in…
          </span>
        ) : (
          "Sign In"
        )}
      </Button>

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
