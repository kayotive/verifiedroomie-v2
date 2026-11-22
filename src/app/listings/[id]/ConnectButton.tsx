"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BuyPointsModal from "@/components/BuyPointsModal";

export default function ConnectButton({
  receiverId,
  listingId = null,
  points,
}: {
  receiverId: string;
  listingId?: string | null;
  points: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPlans, setShowPlans] = useState(false);

  async function connect() {
    // No points left: show the packages instead of doing nothing
    if (points < 1) {
      setShowPlans(true);
      return;
    }

    setLoading(true);
    setError("");
    const { error } = await createClient().rpc("send_connection_request", {
      p_receiver: receiverId,
      p_listing: listingId,
    });
    setLoading(false);
    if (error) {
      // The database says there are no points, even though the screen thought there were
      if (error.message.includes("no Connect Points")) {
        setShowPlans(true);
        return;
      }
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={connect}
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Sending..." : "Connect"}
      </button>
      <p className="text-center text-xs text-gray-500">
        {points < 1
          ? "You have no Connect Points left. Tap Connect to see the packages."
          : `Uses 1 Connect Point. You have ${points} left.`}
      </p>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <BuyPointsModal open={showPlans} onClose={() => setShowPlans(false)} />
    </div>
  );
}