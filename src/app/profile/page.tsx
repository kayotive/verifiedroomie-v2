import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarZoom from "@/components/AvatarZoom";
import LogoutButton from "../dashboard/LogoutButton";
import ProfileForm from "./ProfileForm";
import DeleteAccount from "./DeleteAccount";

const genderLabels: Record<string, string> = { male: "Male", female: "Female", other: "Other" };
const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
};
const smokingLabels: Record<string, string> = { non_smoker: "Non-smoker", smoker: "Smoker" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: p } = await supabase
    .from("profiles")
    .select(
       "full_name, gender, birth_year, occupation, religion, smoking, avatar_url, bio, roomie_gender_preference, user_type, id_verified, phone_verified, is_admin"
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

      <section className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          This is how others see you
        </p>
        <div className="flex items-center gap-3">
          {p.avatar_url && (
            <AvatarZoom src={p.avatar_url} name={p.full_name} size={80} />
          )}
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
        <div className="mt-3 flex flex-wrap gap-1">
          {badges.map((b) => (
            <span key={b} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {b}
            </span>
          ))}
        </div>
      </section>

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