import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerifyForm from "./VerifyForm";

export default async function VerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, id_verified")
    .eq("id", user.id)
    .single();
  if (!profile?.user_type) redirect("/onboarding");

  const { data: latest } = await supabase
    .from("id_verifications")
    .select("status, admin_note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const backHref = profile.user_type === "owner" ? "/dashboard" : "/feed";

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href={backHref} className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-bold text-gray-900">Verify your identity</h1>
      <p className="mb-5 text-gray-600">
        Verified people get a 🪪 badge, which helps others trust you. Only our admin
        team can see your document, and it is never shown on your profile.
      </p>

      {profile.id_verified ? (
        <p className="rounded-2xl bg-emerald-50 p-4 text-center font-semibold text-emerald-800">
          ✅ Your identity is verified.
        </p>
      ) : latest?.status === "pending" ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-center text-amber-800">
          ⏳ Your document is under review. This usually takes a short while.
        </p>
      ) : (
        <>
          {latest?.status === "rejected" && (
            <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              Your last submission wasn&apos;t approved
              {latest.admin_note ? `: ${latest.admin_note}` : "."} Please submit a clearer
              document.
            </p>
          )}
          <VerifyForm />
        </>
      )}
    </main>
  );
}