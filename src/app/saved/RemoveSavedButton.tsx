"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RemoveSavedButton({ savedId }: { savedId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setLoading(true);
    setError("");
    const { error } = await createClient().from("saved_listings").delete().eq("id", savedId);
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
        onClick={remove}
        disabled={loading}
        className="text-sm font-semibold text-slate-600 transition hover:text-red-700 disabled:opacity-60"
      >
        {loading ? "Removing..." : "Remove from saved"}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}