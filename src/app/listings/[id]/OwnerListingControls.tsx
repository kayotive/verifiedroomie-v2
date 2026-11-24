"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STALE_DAYS = 30;

const reasonOptions = [
  { value: "found_here", label: "Found someone on VerifiedRoomie 🎉" },
  { value: "found_elsewhere", label: "Found someone elsewhere" },
  { value: "paused", label: "Just pausing for now" },
];

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
}

function agoLabel(days: number) {
  if (days <= 0) return "today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export default function OwnerListingControls({
  listingId,
  roomAvailable,
  roomiesWanted,
  hiddenReason,
  lastConfirmedAt,
}: {
  listingId: string;
  roomAvailable: boolean;
  roomiesWanted: number;
  hiddenReason: string | null;
  lastConfirmedAt: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false); // delete confirmation
  const [choosingReason, setChoosingReason] = useState(false);
  const [error, setError] = useState("");
  const [roomies, setRoomies] = useState(String(roomiesWanted));
  const [roomiesSaved, setRoomiesSaved] = useState(false);

  const days = daysSince(lastConfirmedAt);
  const stale = roomAvailable && days >= STALE_DAYS;
  const reasonLabel =
    reasonOptions.find((o) => o.value === hiddenReason)?.label ?? "Hidden by you";

  async function updateListing(changes: Record<string, unknown>) {
    setLoading(true);
    setError("");
    const { error } = await supabase.from("listings").update(changes).eq("id", listingId);
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    router.refresh();
    return true;
  }

  async function hide(reason: string) {
    const ok = await updateListing({ room_available: false, hidden_reason: reason });
    if (ok) setChoosingReason(false);
  }

  function showAgain() {
    return updateListing({
      room_available: true,
      hidden_reason: null,
      last_confirmed_at: new Date().toISOString(),
    });
  }

  function stillAvailable() {
    return updateListing({ last_confirmed_at: new Date().toISOString() });
  }

  async function saveRoomies(value: string) {
    const previous = roomies;
    setRoomies(value);
    setRoomiesSaved(false);
    const ok = await updateListing({
      roomies_wanted: Number(value),
      last_confirmed_at: new Date().toISOString(),
    });
    if (!ok) {
      setRoomies(previous);
      return;
    }
    setRoomiesSaved(true);
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
      {roomAvailable ? (
        <>
          <p className="text-center font-semibold text-gray-900">
            {stale ? "⚠️ Hidden from the feed until you confirm" : "✅ Listing is live"}
          </p>
          <p className="text-center text-xs text-gray-500">
            Availability confirmed {agoLabel(days)}. Listings not confirmed for {STALE_DAYS} days
            are hidden from the feed.
          </p>
          <button
            onClick={stillAvailable}
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            ✓ Yes, still available
          </button>
        </>
      ) : (
        <>
          <p className="text-center font-semibold text-gray-900">🔒 Hidden from the feed</p>
          <p className="text-center text-xs text-gray-500">
            {reasonLabel}. Seekers can&apos;t see this listing until you show it again.
          </p>
          <button
            onClick={showAgain}
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Show listing again
          </button>
        </>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Roomies you&apos;re still accepting
        </label>
        <select
          value={roomies}
          onChange={(e) => saveRoomies(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-600 focus:outline-none disabled:opacity-60"
        >
          <option value="1">Accepting 1 roomie (2 occupants)</option>
          <option value="2">Accepting 2 roomies (3 occupants)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {roomiesSaved
            ? "Saved ✅ Seekers now see the new number."
            : "Saves as soon as you change it. The area can't be changed."}
        </p>
      </div>

      {roomAvailable &&
        (!choosingReason ? (
          <button
            onClick={() => setChoosingReason(true)}
            className="rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-white"
          >
            Hide listing from feed
          </button>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="text-sm font-medium text-gray-700">Why are you hiding it?</p>
            <div className="mt-2 flex flex-col gap-2">
              {reasonOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => hide(o.value)}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setChoosingReason(false)}
              disabled={loading}
              className="mt-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        ))}

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
            This permanently deletes the listing, its photos and its video, and ends every connection made through it (phone numbers will stop showing). Seekers with unanswered requests get their Connect Point back. This cannot be undone.
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