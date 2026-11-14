"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RequestActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function answer(status: "accepted" | "rejected") {
    setLoading(true);
    setError("");
    const { error } = await createClient()
      .from("connections")
      .update({ status })
      .eq("id", id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <button
          onClick={() => answer("accepted")}
          disabled={loading}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Accept
        </button>
        <button
          onClick={() => answer("rejected")}
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Reject
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}