"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Check your email</h1>
        <p className="text-gray-600">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset
          your password. Open it in the same browser you&apos;re using now.
        </p>
        <Link href="/login" className="font-semibold text-emerald-700">
          Back to Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-3xl font-bold text-gray-900">Forgot password?</h1>
      <p className="mb-6 mt-1 text-gray-600">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none"
        />

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <Link href="/login" className="text-center text-sm font-semibold text-emerald-700">
          Back to Login
        </Link>
      </form>
    </main>
  );
}