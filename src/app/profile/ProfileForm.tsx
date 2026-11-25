"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkBio } from "@/lib/bioCheck";
import { checkPhone } from "@/lib/phoneCheck";
import LocationSelect from "@/components/LocationSelect";
import PhotoPicker from "@/components/PhotoPicker";

type Initial = {
  fullName: string;
  phone: string;
  gender: string;
  occupation: string;
  religion: string;
  smoking: string;
  bio: string;
  avatarUrl: string;
  roomiePreference: string;
  userType: string;
  lookingState: string;
  lookingArea: string;
};

const inputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

export default function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    fullName: initial.fullName,
    phone: initial.phone,
    gender: initial.gender,
    occupation: initial.occupation,
    religion: initial.religion,
    smoking: initial.smoking,
    bio: initial.bio,
    roomiePreference: initial.roomiePreference || "any",
    lookingState: initial.lookingState,
    lookingArea: initial.lookingArea,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(initial.avatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function update(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setSaved(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function onPhoto(f: File) {
    if (f.size > 5 * 1024 * 1024) {
      setError("Photo must be smaller than 5 MB.");
      return;
    }
    setError("");
    setSaved(false);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!form.bio.trim()) {
      setError("Please write something about yourself. This can't be left empty.");
      return;
    }
    if (initial.userType === "seeker" && !form.lookingState) {
      setError("Please choose where you are looking.");
      return;
    }

    const bioCheck = checkBio(form.bio);
    if (!bioCheck.ok) {
      setError(bioCheck.message);
      return;
    }

    const phoneCheck = checkPhone(form.phone);
    if (!phoneCheck.ok) {
      setError(phoneCheck.message);
      return;
    }

    setLoading(true);
    const { data: taken, error: phoneErr } = await supabase.rpc("phone_exists", {
      p_phone: phoneCheck.phone,
    });
    if (phoneErr) {
      setLoading(false);
      setError("Could not check the phone number. Please try again.");
      return;
    }
    if (taken) {
      setLoading(false);
      setError("Phone number already exists. If this is your number, please contact support.");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let avatarUrl: string | undefined;
    if (file) {
      const path = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        setLoading(false);
        setError(uploadError.message);
        return;
      }
      avatarUrl = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        roomie_gender_preference: form.roomiePreference || "any",
        occupation: form.occupation || null,
        religion: form.religion || null,
        smoking: form.smoking || null,
        bio: form.bio.trim() || null,
        ...(initial.userType === "seeker"
          ? {
              looking_state: form.lookingState,
              looking_area: form.lookingArea || null,
            }
          : {}),
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", user.id);

    if (profileError) {
      setLoading(false);
      setError(profileError.message);
      return;
    }

    const { error: phoneError } = await supabase
      .from("private_details")
      .update({ phone: phoneCheck.phone })
      .eq("id", user.id);

    setLoading(false);
    if (phoneError) {
      setError(phoneError.message);
      return;
    }

    setForm((f) => ({ ...f, phone: phoneCheck.phone }));
    setFile(null);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm text-gray-400">No photo</span>
          )}
        </div>
        <PhotoPicker onFile={onPhoto} onError={setError} />
        {file && (
          <p className="text-xs font-semibold text-emerald-700">
            New photo selected. Tap &quot;Save changes&quot; below to keep it.
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          Full name <span className="font-normal text-gray-500">(cannot be changed)</span>
        </label>
        <input
          name="fullName"
          value={form.fullName}
          disabled
          className={`${inputClass} cursor-not-allowed bg-gray-100 text-gray-500`}
        />
      </div>

      <div>
        <label className={labelClass}>Phone number</label>
        <input name="phone" type="tel" value={form.phone} onChange={update} className={inputClass} />
        <p className="mt-1 text-xs text-gray-500">Only shared with people you connect with.</p>
      </div>

      <div>
        <label className={labelClass}>About me</label>
        <textarea
          name="bio"
          required
          rows={4}
          maxLength={300}
          placeholder="Tell people a little about yourself: your routine, what you're like to live with..."
          value={form.bio}
          onChange={update}
          className={inputClass}
        />
        <p className="mt-1 text-right text-xs text-gray-500">{form.bio.length}/300</p>
      </div>

      <div>
        <label className={labelClass}>
          Gender <span className="font-normal text-gray-500">(cannot be changed)</span>
        </label>
        <select
          name="gender"
          value={form.gender}
          disabled
          className={`${inputClass} cursor-not-allowed bg-gray-100 text-gray-500`}
        >
          <option value="">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Roomie gender preference</label>
        <select
          name="roomiePreference"
          value={form.roomiePreference}
          onChange={update}
          className={inputClass}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="any">No preference</option>
        </select>
      </div>

      {initial.userType === "seeker" && (
        <>
          <LocationSelect
            state={form.lookingState}
            area={form.lookingArea}
            onChange={(s, a) => {
              setSaved(false);
              setForm({ ...form, lookingState: s, lookingArea: a });
            }}
            inputClass={inputClass}
            labelClass={labelClass}
          />
        </>
      )}

      <div>
        <label className={labelClass}>Occupation</label>
        <select name="occupation" value={form.occupation} onChange={update} className={inputClass}>
          <option value="">Select...</option>
          <option value="student">Student</option>
          <option value="nysc_corper">NYSC Corper</option>
          <option value="professional">Professional</option>
          <option value="other">Others</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Religion (optional)</label>
        <select name="religion" value={form.religion} onChange={update} className={inputClass}>
          <option value="">Prefer not to say</option>
          <option value="Christian">Christian</option>
          <option value="Muslim">Muslim</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Smoking</label>
        <select name="smoking" value={form.smoking} onChange={update} className={inputClass}>
          <option value="">Select...</option>
          <option value="non_smoker">Non-smoker</option>
          <option value="smoker">Smoker</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Saved ✅</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}