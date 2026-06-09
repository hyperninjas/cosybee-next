"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Alert, Button, Input, Spinner } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password: newPassword,
      });

      if (error) {
        setError(error.message || "Failed to reset password");
        setLoading(false);
        return;
      }

      // Success - redirect to login
      router.push("/admin/login?reset=success");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-black">Reset Password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter the code sent to your email and your new password.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="otp" className="mb-1 block text-sm font-medium text-[#333]">
            6-Digit Code
          </label>
          <Input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            className="text-center font-mono text-2xl tracking-[0.5em]"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-[#333]">
            New Password
          </label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 8 characters)"
            minLength={8}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-[#333]">
            Confirm New Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
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
            <Spinner size="sm" /> Resetting…
          </span>
        ) : (
          "Reset Password"
        )}
      </Button>

      <div className="text-center">
        <Link href="/admin/login" className="text-sm text-[#FF8A7A] hover:underline">
          Back to login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          Loading...
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
