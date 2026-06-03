"use client";
import { useState } from "react";
import Link from "next/link";

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/email-otp/send-verification-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            type: "forget-password",
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to send reset code");
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
            className="inline-block mt-4 px-6 py-3 bg-[#1b1b1b] text-white font-semibold rounded-lg hover:bg-[#333] transition-colors"
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
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8A7A] focus:border-transparent outline-none transition-all"
          />
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
              Sending...
            </span>
          ) : (
            "Send Reset Code"
          )}
        </button>

        <div className="text-center">
          <Link href="/admin/login" className="text-sm text-[#FF8A7A] hover:underline">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
