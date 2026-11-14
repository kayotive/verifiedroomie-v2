"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function VerifyForm() {
  const router = useRouter();
  const supabase = createClient();
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE) {
      setError("That file is too large. Please keep it under 10 MB.");
      e.target.value = "";
      return;
    }
    setError("");
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please choose a clear photo or PDF of your document.");
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("id-documents")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setLoading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("id_verifications").insert({
      user_id: user.id,
      document_type: docType,
      document_path: path,
    });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Document type</label>
        <select
          required
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none"
        >
          <option value="">Select...</option>
          <option value="nin">NIN</option>
          <option value="passport">International Passport</option>
          <option value="drivers_licence">Driver&apos;s Licence</option>
          <option value="voters_card">Voter&apos;s Card</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Photo or PDF of the document</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={onPick}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700"
        />
        {file && <p className="mt-1 text-xs text-emerald-700">Selected: {file.name}</p>}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Submit for review"}
      </button>
    </form>
  );
}