"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const reasonText: Record<string, string> = {
  found_here: "I found a place on VerifiedRoomie",
  found_elsewhere: "I found a place elsewhere",
  paused: "I'm just taking a break",
};

export default function HiddenProfileConnect({ reason }: { reason: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function show() {
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
      .update({ is_paused: false, paused_reason: null })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const why = reason ? reasonText[reason] : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
      >
        Connect
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Your profile is hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">🔒 Your profile is hidden</h2>
            <p className="mt-2 text-sm text-gray-600">
              {why ? <>Your profile is hidden because you chose “{why}”. </> : "Your profile is hidden. "}
              Make your profile visible again before you send a new request, so owners can see who
              you are.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={show}
                disabled={loading}
                className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Show my profile"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}