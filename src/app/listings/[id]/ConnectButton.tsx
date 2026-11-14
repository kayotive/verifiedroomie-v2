"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConnectButton({
  receiverId,
  listingId,
  points,
}: {
  receiverId: string;
  listingId: string;
  points: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setLoading(true);
    setError("");
    const { error } = await createClient().rpc("send_connection_request", {
      p_receiver: receiverId,
      p_listing: listingId,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        disabled={loading || points < 1}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Sending..." : "Connect"}
      </button>
      <p className="text-center text-xs text-gray-500">
        Uses 1 Connect Point. You have {points} left.
      </p>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}