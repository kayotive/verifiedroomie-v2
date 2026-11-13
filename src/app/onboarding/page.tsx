"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "owner" | "seeker";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Photo must be smaller than 5 MB.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleContinue() {
    if (!file) {
      setError("Please add a profile photo.");
      return;
    }
    if (!status) {
      setError("Please choose one of the two options.");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const path = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setLoading(false);
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: `${data.publicUrl}?v=${Date.now()}`,
        user_type: status,
      })
      .eq("id", user.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const optionClass = (selected: boolean) =>
    `w-full rounded-2xl border-2 p-4 text-left font-semibold transition ${
      selected
        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
        : "border-gray-200 text-gray-800 hover:border-emerald-300"
    }`;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Almost there</h1>
        <p className="mt-1 text-gray-600">Add your photo and tell us what brings you here.</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm text-gray-400">No photo</span>
          )}
        </div>
        <label className="cursor-pointer rounded-xl border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
          {preview ? "Change photo" : "Upload profile photo"}
          <input type="file" accept="image/*" onChange={onPick} className="hidden" />
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-900">What best describes you?</h2>
        <button type="button" onClick={() => setStatus("owner")} className={optionClass(status === "owner")}>
          🏠 I Have an Apartment
        </button>
        <button type="button" onClick={() => setStatus("seeker")} className={optionClass(status === "seeker")}>
          🔍 I&apos;m Looking for an Apartment / Roommate
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        onClick={handleContinue}
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </main>
  );
}