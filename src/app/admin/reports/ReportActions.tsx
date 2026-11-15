"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ReportActions({
  reportId,
  reportedUserId,
}: {
  reportId: string;
  reportedUserId: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function act(kind: "dismissed" | "resolved" | "suspend") {
    setLoading(true);
    setError("");
    const supabase = createClient();

    if (kind === "suspend") {
      const { error } = await supabase.rpc("set_user_suspended", {
        p_user: reportedUserId,
        p_value: true,
      });
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
    }

    const { error } = await supabase.rpc("resolve_report", {
      p_id: reportId,
      p_status: kind === "dismissed" ? "dismissed" : "resolved",
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
        placeholder="Internal note (optional)"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
      />
      <div className="flex gap-2">
        <button onClick={() => act("dismissed")} disabled={loading} className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
          Dismiss
        </button>
        <button onClick={() => act("resolved")} disabled={loading} className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          Resolve
        </button>
        <button onClick={() => act("suspend")} disabled={loading} className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          Suspend user
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function ReinstateButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reinstate() {
    setLoading(true);
    setError("");
    const { error } = await createClient().rpc("set_user_suspended", {
      p_user: userId,
      p_value: false,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        onClick={reinstate}
        disabled={loading}
        className="rounded-xl border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
      >
        {loading ? "..." : "Reinstate"}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}