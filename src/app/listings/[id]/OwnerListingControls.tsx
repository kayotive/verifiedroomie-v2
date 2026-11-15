"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OwnerListingControls({
  listingId,
  roomAvailable,
}: {
  listingId: string;
  roomAvailable: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("listings")
      .update({ room_available: !roomAvailable })
      .eq("id", listingId);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function remove() {
    setLoading(true);
    setError("");

    // Delete the photos and video first
    const { data: media } = await supabase
      .from("listing_media")
      .select("path")
      .eq("listing_id", listingId);
    const paths = (media ?? []).map((m) => m.path);
    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage
        .from("listing-media")
        .remove(paths);
      if (removeError) {
        setLoading(false);
        setError(removeError.message);
        return;
      }
    }

    const { error } = await supabase.from("listings").delete().eq("id", listingId);
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-semibold text-gray-900">
        {roomAvailable ? "✅ Room is available" : "🔒 Room is marked as taken"}
      </p>
      <p className="text-center text-xs text-gray-500">
        {roomAvailable
          ? "People can find this listing in the feed."
          : "This listing is hidden from the feed."}
      </p>

      <button
        onClick={toggle}
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {roomAvailable ? "Mark room as taken" : "Mark room as available again"}
      </button>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-sm font-semibold text-red-600 hover:text-red-700"
        >
          Delete this listing
        </button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            This permanently deletes the listing, its photos and its video. This cannot be undone.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={remove}
              disabled={loading}
              className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}