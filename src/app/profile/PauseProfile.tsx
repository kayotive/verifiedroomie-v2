"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const options = [
  { value: "found_here", label: "I found a place on VerifiedRoomie 🎉" },
  { value: "found_elsewhere", label: "I found a place elsewhere" },
  { value: "paused", label: "I'm just taking a break" },
];

export default function PauseProfile({
  paused,
  reason,
}: {
  paused: boolean;
  reason: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [choosing, setChoosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(nextPaused: boolean, why: string | null) {
    setLoading(true);
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ is_paused: nextPaused, paused_reason: why })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setChoosing(false);
    router.refresh();
  }

  const reasonLabel = options.find((o) => o.value === reason)?.label;

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 p-4">
      {paused ? (
        <>
          <p className="font-semibold text-gray-900">🔒 Your profile is hidden</p>
          <p className="mt-1 text-sm text-gray-600">
            {reasonLabel ? `${reasonLabel}. ` : ""}
            Owners can&apos;t find you on the People page. Anyone you&apos;ve already connected
            with can still reach you.
          </p>
          <button
            onClick={() => save(false, null)}
            disabled={loading}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Show my profile again
          </button>
        </>
      ) : !choosing ? (
        <>
          <p className="font-semibold text-gray-900">Found a place, or need a break?</p>
          <p className="mt-1 text-sm text-gray-600">
            Hide your profile so owners stop sending you requests. You can bring it back any time.
          </p>
          <button
            onClick={() => setChoosing(true)}
            className="mt-3 rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Hide my profile
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold text-gray-900">Why are you hiding it?</p>
          <div className="mt-2 flex flex-col gap-2">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => save(true, o.value)}
                disabled={loading}
                className="rounded-xl border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setChoosing(false)}
            disabled={loading}
            className="mt-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}