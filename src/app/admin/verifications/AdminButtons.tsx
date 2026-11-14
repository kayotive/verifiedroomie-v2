"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function IdReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function review(approve: boolean) {
    setLoading(true);
    setError("");
    const { error } = await createClient().rpc("review_id_verification", {
      p_id: id,
      p_approve: approve,
      p_note: note.trim() || null,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note to the user (shown if rejected)"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => review(true)}
          disabled={loading}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          onClick={() => review(false)}
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function ApartmentVerifyButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verify() {
    setLoading(true);
    setError("");
    const { error } = await createClient().rpc("set_apartment_verified", {
      p_listing: listingId,
      p_value: true,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={verify}
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        🏠 Mark apartment verified
      </button>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}