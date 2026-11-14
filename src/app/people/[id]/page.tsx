import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/phone";
import ConnectButton from "../../listings/[id]/ConnectButton";

const genderLabels: Record<string, string> = { male: "Male", female: "Female", other: "Other" };
const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
};
const smokingLabels: Record<string, string> = { non_smoker: "Non-smoker", smoker: "Smoker" };

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("user_type, connect_points")
    .eq("id", user.id)
    .single();
  if (me?.user_type !== "owner") redirect("/feed");

  const { data: person } = await supabase
    .from("profiles")
    .select(
      "id, full_name, gender, birth_year, occupation, religion, smoking, avatar_url, bio, id_verified, phone_verified, user_type"
    )
    .eq("id", id)
    .maybeSingle();

  if (!person || person.user_type !== "seeker") notFound();

  const { data: connection } = await supabase
    .from("connections")
    .select("status, requester_id")
    .or(
      `and(requester_id.eq.${user.id},receiver_id.eq.${person.id}),and(requester_id.eq.${person.id},receiver_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle();

  let phone: string | null = null;
  if (connection?.status === "accepted") {
    const { data: num } = await supabase.rpc("get_contact_phone", { p_user: person.id });
    phone = (num as string | null) ?? null;
  }

  const age = person.birth_year ? new Date().getFullYear() - person.birth_year : null;
  const firstName = person.full_name.split(" ")[0] || "New user";
  const badges = ["📧 Email verified"];
  if (person.phone_verified) badges.push("📱 Phone verified");
  if (person.id_verified) badges.push("🪪 ID verified");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href="/people" className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>

      <div className="mt-4 flex flex-col items-center text-center">
        {person.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatar_url} alt={firstName} className="h-32 w-32 rounded-full object-cover" />
        )}
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          {firstName}
          {age ? `, ${age}` : ""}
        </h1>
        <p className="text-gray-600">
          {person.gender ? genderLabels[person.gender] : ""}
          {person.occupation ? ` · ${occupationLabels[person.occupation]}` : ""}
        </p>
        <p className="text-sm text-gray-600">
          {person.religion ?? ""}
          {person.smoking ? ` · ${smokingLabels[person.smoking]}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {badges.map((b) => (
            <span key={b} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {b}
            </span>
          ))}
        </div>
      </div>

      {person.bio && (
        <section className="mt-5">
          <h2 className="mb-1 font-semibold text-gray-900">About {firstName}</h2>
          <p className="whitespace-pre-line text-gray-700">{person.bio}</p>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        {!connection ? (
          <ConnectButton receiverId={person.id} points={me.connect_points} />
        ) : connection.status === "pending" ? (
          connection.requester_id === user.id ? (
            <p className="text-center text-gray-700">
              ✅ Request sent. Their phone number shows here once they accept.
            </p>
          ) : (
            <p className="text-center text-gray-700">
              {firstName} sent you a request.{" "}
              <Link href="/requests" className="font-semibold text-emerald-700">
                View requests
              </Link>
            </p>
          )
        ) : connection.status === "accepted" ? (
          <div className="text-center">
            <p className="font-semibold text-gray-900">🎉 You&apos;re connected!</p>
            {phone ? (
              <>
                <p className="mt-1 text-lg text-gray-800">{phone}</p>
                <div className="mt-2 flex justify-center gap-3">
                  <a href={`tel:${phone}`} className="font-semibold text-emerald-700">Call</a>
                  <a href={whatsappLink(phone)} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700">
                    WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">No phone number on file.</p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-700">This request was declined.</p>
        )}
      </section>
    </main>
  );
}