"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

const REQUIRED_PHOTOS = [
  { key: "living_room", label: "Living Room" },
  { key: "bedroom", label: "Bedroom" },
  { key: "kitchen", label: "Kitchen" },
  { key: "bathroom", label: "Bathroom" },
];
const OPTIONAL_PHOTOS = [
  { key: "balcony", label: "Balcony" },
  { key: "compound", label: "Compound" },
  { key: "parking", label: "Parking" },
];

const MAX_PHOTO = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO = 50 * 1024 * 1024; // 50 MB

function FileField({
  label,
  accept,
  required,
  file,
  onPick,
}: {
  label: string;
  accept: string;
  required?: boolean;
  file?: File;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type="file"
        accept={accept}
        onChange={onPick}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700"
      />
      {file && <p className="mt-1 text-xs text-emerald-700">Selected: {file.name}</p>}
    </div>
  );
}

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    apartmentType: "",
    roomAvailable: "yes",
    contributionAmount: "",
    moveInDate: "",
    description: "",
    houseRules: "",
    placeName: "",
    area: "",
  });
  const [files, setFiles] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function pickFile(key: string, kind: "photo" | "video") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const limit = kind === "photo" ? MAX_PHOTO : MAX_VIDEO;
      if (f.size > limit) {
        setError(
          kind === "photo"
            ? "That photo is too large. Photos must be under 10 MB."
            : "That video is too large. Please keep it under 50 MB (try recording at 720p)."
        );
        e.target.value = "";
        return;
      }
      setError("");
      setFiles((prev) => ({ ...prev, [key]: f }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const missing = REQUIRED_PHOTOS.filter((p) => !files[p.key]);
    if (missing.length > 0) {
      setError(`Please add photos for: ${missing.map((m) => m.label).join(", ")}.`);
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

    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert({
        owner_id: user.id,
        apartment_type: form.apartmentType,
        room_available: form.roomAvailable === "yes",
        contribution_amount: Number(form.contributionAmount),
        move_in_date: form.moveInDate,
        description: form.description,
        house_rules: form.houseRules,
        place_name: form.placeName,
        area: form.area,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError || !listing) {
      setLoading(false);
      setError(insertError?.message ?? "Could not create the listing.");
      return;
    }

    try {
      for (const [key, file] of Object.entries(files)) {
        const kind = key === "video" ? "video" : "photo";
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${listing.id}/${key}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-media")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw uploadError;

        const { error: mediaError } = await supabase
          .from("listing_media")
          .insert({ listing_id: listing.id, kind, category: key, path });
        if (mediaError) throw mediaError;
      }

      const { error: publishError } = await supabase
        .from("listings")
        .update({ status: "published" })
        .eq("id", listing.id);
      if (publishError) throw publishError;
    } catch (err) {
      await supabase.from("listings").delete().eq("id", listing.id);
      setLoading(false);
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Upload failed. Please try again."
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mt-3 text-3xl font-bold text-gray-900">Create Listing</h1>
      <p className="mb-6 mt-1 text-gray-600">Tell people about your apartment.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Apartment Type</label>
          <select name="apartmentType" required value={form.apartmentType} onChange={update} className={inputClass}>
            <option value="">Select...</option>
            <option value="self_contained">Self-contained</option>
            <option value="1_bedroom">1 Bedroom</option>
            <option value="2_bedroom">2 Bedroom</option>
            <option value="3_bedroom">3 Bedroom</option>
            <option value="other">Others</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Room Available?</label>
          <select name="roomAvailable" value={form.roomAvailable} onChange={update} className={inputClass}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Contribution Amount (₦ per year)</label>
          <input name="contributionAmount" type="number" min={1} required placeholder="450000" value={form.contributionAmount} onChange={update} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Move-in Date</label>
          <input name="moveInDate" type="date" required value={form.moveInDate} onChange={update} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Estate, Street or Landmark</label>
          <input name="placeName" required placeholder="Living Faith Junction" value={form.placeName} onChange={update} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Area and City</label>
          <input name="area" required placeholder="Jikwoyi, Abuja" value={form.area} onChange={update} className={inputClass} />
          <p className="mt-1 text-xs text-gray-500">The map pin comes in the next update. This cannot be changed after you publish.</p>
        </div>

        <div>
          <label className={labelClass}>Short Description</label>
          <textarea name="description" required rows={3} placeholder="Looking for a neat, responsible roommate." value={form.description} onChange={update} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>House Rules</label>
          <textarea name="houseRules" required rows={3} placeholder={"No smoking.\nNo loud parties.\nVisitors allowed only on weekends."} value={form.houseRules} onChange={update} className={inputClass} />
        </div>

        <h2 className="mt-2 text-lg font-semibold text-gray-900">Apartment Photos</h2>
        {REQUIRED_PHOTOS.map((p) => (
          <FileField key={p.key} label={p.label} required accept="image/jpeg,image/png,image/webp" file={files[p.key]} onPick={pickFile(p.key, "photo")} />
        ))}

        <h2 className="mt-2 text-lg font-semibold text-gray-900">Optional</h2>
        {OPTIONAL_PHOTOS.map((p) => (
          <FileField key={p.key} label={`${p.label} photo`} accept="image/jpeg,image/png,image/webp" file={files[p.key]} onPick={pickFile(p.key, "photo")} />
        ))}
        <FileField label="Apartment walkthrough video (20 to 45 seconds, under 50 MB)" accept="video/mp4,video/quicktime,video/webm" file={files.video} onPick={pickFile("video", "video")} />

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Uploading, please wait..." : "Publish Listing"}
        </button>
      </form>
    </main>
  );
}