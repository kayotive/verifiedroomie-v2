"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LISTING_REASONS: [string, string][] = [
  ["fake_listing", "Fake listing"],
  ["fraud", "Fraud"],
  ["scam", "Scam"],
  ["harassment", "Harassment"],
  ["other", "Something else"],
];
const PERSON_REASONS: [string, string][] = [
  ["fraud", "Fraud"],
  ["scam", "Scam"],
  ["harassment", "Harassment"],
  ["other", "Something else"],
];

export default function ReportBlock({
  userId,
  listingId = null,
  isListing = false,
  afterBlockHref,
}: {
  userId: string;
  listingId?: string | null;
  isListing?: boolean;
  afterBlockHref: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"" | "report" | "block">("");
  const [type, setType] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const reasons = isListing ? LISTING_REASONS : PERSON_REASONS;

  async function submitReport() {
    if (!type) {
      setError("Please choose a reason.");
      return;
    }
    setLoading(true);
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: userId,
      listing_id: listingId,
      type,
      details: details.trim() || null,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
    setMode("");
  }

  async function confirmBlock() {
    setLoading(true);
    setError("");
    const { error } = await supabase.rpc("block_user", { p_user: userId });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    router.push(afterBlockHref);
    router.refresh();
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-4">
      {sent && (
        <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-center text-sm text-emerald-800">
          Thank you. Our team will review your report.
        </p>
      )}

      <div className="flex justify-center gap-6 text-sm font-semibold text-gray-500">
        <button onClick={() => { setMode(mode === "report" ? "" : "report"); setError(""); }} className="hover:text-gray-700">
          🚩 Report
        </button>
        <button onClick={() => { setMode(mode === "block" ? "" : "block"); setError(""); }} className="hover:text-gray-700">
          🚫 Block
        </button>
      </div>

      {mode === "report" && (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-gray-200 p-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          >
            <option value="">What is the problem?</option>
            {reasons.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Tell us what happened (optional)"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
          <button
            onClick={submitReport}
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send report"}
          </button>
        </div>
      )}

      {mode === "block" && (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-gray-200 p-3">
          <p className="text-sm text-gray-700">
            You won&apos;t see each other anywhere in the app, and any request or connection
            between you will be removed. They won&apos;t be told. You can undo this later
            from the Blocked users page.
          </p>
          <button
            onClick={confirmBlock}
            disabled={loading}
            className="rounded-xl bg-gray-800 px-4 py-2 font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
          >
            {loading ? "Blocking..." : "Yes, block this person"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}