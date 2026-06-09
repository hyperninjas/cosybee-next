"use client";
import { useState } from "react";
import Link from "next/link";
import { Alert, Button, buttonVariants, Input, Spinner } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });

      if (error) {
        setError(error.message || "Failed to send reset code");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="w-full max-w-md p-8 text-center space-y-6 bg-white rounded-xl shadow-lg">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-black">Check your email</h2>
          <p className="text-gray-600">
            We sent a 6-digit code to <strong className="text-black">{email}</strong>
          </p>
          <p className="text-sm text-gray-500">Code expires in 5 minutes</p>
          <Link
            href={`/admin/reset-password?email=${encodeURIComponent(email)}`}
            className={`mt-4 ${buttonVariants({ variant: "secondary" })}`}
          >
            Enter Code
          </Link>
          <div className="pt-4">
            <Link href="/admin/login" className="text-sm text-[#FF8A7A] hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black">Forgot Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to receive a reset code.
          </p>
        </div>

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

        {error && (
          <Alert status="danger">
            <Alert.Description>{error}</Alert.Description>
          </Alert>
        )}

        <Button type="submit" variant="secondary" fullWidth isDisabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" /> Sending…
            </span>
          ) : (
            "Send Reset Code"
          )}
        </Button>

        <div className="text-center">
          <Link href="/admin/login" className="text-sm text-[#FF8A7A] hover:underline">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
