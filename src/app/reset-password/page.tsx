"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";
import Logo from "@/components/Logo";
import ContactLinks from "@/components/ContactLinks";

const inputClass =
  "w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-brand-600 focus:outline-none";

const buttonClass =
  "rounded-xl bg-brand-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60";

type Stage = "checking" | "expired" | "form" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The reset link signs the person in for a moment. If there is no session, the link is
  // missing, used up, or expired.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setStage(data.user ? "form" : "expired");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Sign out everywhere, so the person logs in fresh with the new password
    await supabase.auth.signOut({ scope: "global" });
    router.refresh();
    setLoading(false);
    setStage("done");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex justify-center px-6 pt-8">
        <Logo href="/login" />
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        {stage === "checking" && <p className="text-center text-slate-500">Please wait...</p>}

        {stage === "expired" && (
          <div className="flex flex-col gap-4 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Link expired</h1>
            <p className="text-slate-600">
              This reset link has expired or has already been used. Please request a new one.
            </p>
            <Link href="/forgot-password" className={buttonClass}>
              Request a new link
            </Link>
            <Link href="/login" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Back to login
            </Link>
          </div>
        )}

        {stage === "form" && (
          <>
            <h1 className="text-3xl font-bold text-slate-900">Set a new password</h1>
            <p className="mb-6 mt-1 text-slate-600">Choose a password you haven&apos;t used before.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <PasswordInput
                required
                minLength={8}
                placeholder="New password (at least 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <PasswordInput
                required
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />

              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? "Saving..." : "Update password"}
              </button>
            </form>
          </>
        )}

        {stage === "done" && (
          <div className="flex flex-col gap-4 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Password changed ✅</h1>
            <p className="text-slate-600">Your password has been updated. Please log in with your new password.</p>
            {/* A plain link (full page load) so the header never shows the old signed-in person */}
            <a href="/login" className={buttonClass}>
              Back to login
            </a>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-100 px-6 py-8">
        <div className="mx-auto flex max-w-md justify-center sm:justify-start">
          <ContactLinks />
        </div>
      </footer>
    </div>
  );
}