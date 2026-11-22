"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SaveButton({
  listingId,
  userId,
  initialSaved,
  showLabel = false,
}: {
  listingId: string;
  userId: string;
  initialSaved: boolean;
  showLabel?: boolean;
}) {
  const supabase = createClient();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (busy) return;
    const next = !saved;
    setSaved(next); // update the heart straight away
    setBusy(true);
    setError("");

    const { error } = next
      ? await supabase.from("saved_listings").insert({ user_id: userId, listing_id: listingId })
      : await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", userId)
          .eq("listing_id", listingId);

    setBusy(false);
    // 23505 means it was already saved, which is fine
    if (error && !(next && error.code === "23505")) {
      setSaved(!next);
      setError("Couldn't save. Try again.");
    }
  }

  const buttonClass = showLabel
    ? `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
        saved
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-700"
      }`
    : `flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 ${
        saved ? "text-rose-600" : "text-slate-600"
      }`;

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved listings" : "Save this listing"}
        className={buttonClass}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {showLabel && (saved ? "Saved" : "Save")}
      </button>
      {error && <span className="mt-1 text-xs text-red-700">{error}</span>}
    </span>
  );
}