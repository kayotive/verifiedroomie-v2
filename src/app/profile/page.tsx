import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarZoom from "@/components/AvatarZoom";
import PhotoVerifiedBadge from "@/components/PhotoVerifiedBadge";
import LogoutButton from "../dashboard/LogoutButton";
import ProfileForm from "./ProfileForm";
import DeleteAccount from "./DeleteAccount";
import PauseProfile from "./PauseProfile";
import { lookingText } from "@/lib/locations";
import { TYPE_OPTIONS } from "@/lib/apartmentTypes";

const genderLabels: Record<string, string> = { male: "Male", female: "Female", other: "Other" };
const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
};
const smokingLabels: Record<string, string> = { non_smoker: "Non-smoker", smoker: "Smoker" };
const prefLabels: Record<string, string> = { male: "Male roomie", female: "Female roomie", any: "Any gender" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: p } = await supabase
    .from("profiles")
    .select(
       "full_name, gender, birth_year, occupation, religion, smoking, avatar_url, bio, roomie_gender_preference, looking_state, looking_area, looking_types, is_paused, paused_reason, user_type, id_verified, phone_verified, is_admin, photo_status"
    )
    .eq("id", user.id)
    .single();
  if (!p?.user_type) redirect("/onboarding");

  const { data: priv } = await supabase
    .from("private_details")
    .select("phone")
    .eq("id", user.id)
    .single();

  const backHref = p.user_type === "owner" ? "/dashboard" : "/feed";
  const age = p.birth_year ? new Date().getFullYear() - p.birth_year : null;
  const firstName = p.full_name.split(" ")[0] || "You";

  const badges = ["📧 Email verified"];
  if (p.phone_verified) badges.push("📱 Phone verified");
  if (p.id_verified) badges.push("🪪 ID verified");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href={backHref} className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold text-gray-900">My profile</h1>
      {p.photo_status === "flagged" && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">📷 Please change your profile photo</p>
          <p className="mt-1">
            Your photo does not meet our rules. Use a clear photo of yourself, taken with your camera
            or picked from your gallery, within 24 hours, or your account may be suspended.
          </p>
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          This is how others see you
        </p>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            {p.avatar_url && (
              <AvatarZoom src={p.avatar_url} name={p.full_name} size={80} />
            )}
            <PhotoVerifiedBadge show={p.photo_status === "approved"} />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {firstName}
              {age ? `, ${age}` : ""}
              {p.gender ? ` · ${genderLabels[p.gender]}` : ""}
            </p>
            <p className="text-sm text-gray-600">
              {p.occupation ? occupationLabels[p.occupation] : ""}
              {p.religion ? ` · ${p.religion}` : ""}
              {p.smoking ? ` · ${smokingLabels[p.smoking]}` : ""}
            </p>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
          {p.bio || "You haven't written anything about yourself yet. Add it below."}
        </p>
        <p className="mt-3 text-sm font-medium text-gray-800">
  🏠 Looking for: {prefLabels[p.roomie_gender_preference ?? "any"]}
</p>
{p.user_type === "seeker" && p.looking_state && (
  <p className="mt-1 text-sm font-medium text-gray-800">
    📍 Looking in: {lookingText(p.looking_state, p.looking_area)}
  </p>
)}
{p.user_type === "seeker" && (
  <p className="mt-1 text-sm font-medium text-gray-800">
    🏢 Apartment type:{" "}
    {(p.looking_types ?? []).length
      ? TYPE_OPTIONS.filter((o) => (p.looking_types ?? []).includes(o.value))
          .map((o) => o.label)
          .join(", ")
      : "Any"}
  </p>
)}
<div className="mt-3 flex flex-wrap gap-1">
          {badges.map((b) => (
            <span key={b} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {b}
            </span>
          ))}
        </div>
      </section>

      {p.user_type === "seeker" && (
  <PauseProfile paused={!!p.is_paused} reason={p.paused_reason ?? null} />
)}
<h2 className="mb-3 font-semibold text-gray-900">Edit your details</h2>
      <ProfileForm
        initial={{
          fullName: p.full_name,
          phone: priv?.phone ?? "",
          gender: p.gender ?? "",
          occupation: p.occupation ?? "",
          religion: p.religion ?? "",
          smoking: p.smoking ?? "",
          bio: p.bio ?? "",
           roomiePreference: p.roomie_gender_preference ?? "any",
           userType: p.user_type ?? "",
lookingState: p.looking_state ?? "",
lookingArea: p.looking_area ?? "",
lookingTypes: p.looking_types ?? [],
          avatarUrl: p.avatar_url ?? "",
        }}
      />

      <section className="mt-8 flex flex-col items-center gap-3 border-t border-gray-200 pt-6">
        <Link href="/reset-password" className="font-semibold text-emerald-700">
          🔑 Change password
        </Link>
        {!p.id_verified && (
          <Link href="/verify" className="font-semibold text-emerald-700">
            🪪 Verify your ID
          </Link>
        )}
        <LogoutButton />
      </section>

      <section className="mt-8">
        <DeleteAccount isAdmin={p.is_admin} />
      </section>
    </main>
  );
}