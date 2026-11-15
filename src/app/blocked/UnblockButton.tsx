"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UnblockButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function unblock() {
    setLoading(true);
    await createClient().rpc("unblock_user", { p_user: userId });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={unblock}
      disabled={loading}
      className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
    >
      {loading ? "..." : "Unblock"}
    </button>
  );
}