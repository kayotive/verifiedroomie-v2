"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PhotoReviewActions({
  userId,
  canFlag = true,
}: {
  userId: string;
  canFlag?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function review(ok: boolean) {
    setLoading(true);
    setError("");
    const { error } = await createClient().rpc("review_profile_photo", {
      p_user: userId,
      p_ok: ok,
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
      <div className="flex gap-2">
        <button
          onClick={() => review(true)}
          disabled={loading}
          className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          ✓ Photo is fine
        </button>
        {canFlag && (
          <button
            onClick={() => review(false)}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            ⚑ Flag photo
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function PhotoSuspendButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function suspend() {
    if (!window.confirm("Suspend this account because the photo was not fixed?")) return;
    setLoading(true);
    setError("");
    const { error } = await createClient().rpc("suspend_for_photo", { p_user: userId });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2">
      <button
        onClick={suspend}
        disabled={loading}
        className="w-full rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        Suspend account
      </button>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}