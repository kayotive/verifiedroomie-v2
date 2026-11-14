import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

const typeLabels: Record<string, string> = {
  self_contained: "Self-contained",
  "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom",
  "3_bedroom": "3 Bedroom",
  other: "Other",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, avatar_url, connect_points")
    .eq("id", user.id)
    .single();

  if (!profile?.user_type) redirect("/onboarding");
  if (profile.user_type === "seeker") redirect("/feed");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, apartment_type, area, contribution_amount, status")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { count: pending } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      {profile.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt="Your profile photo"
          className="h-28 w-28 rounded-full object-cover"
        />
      )}
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome, {profile.full_name || "friend"}!
      </h1>
      <p className="text-sm text-gray-600">🎟 Connect Points: {profile.connect_points}</p>

      <div className="flex gap-3">
        <Link
          href="/listings/new"
          className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          + Create Listing
        </Link>
        <Link
          href="/requests"
          className="rounded-xl border border-emerald-600 px-5 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Requests{pending ? ` (${pending})` : ""}
        </Link>
      </div>

      {listings && listings.length > 0 && (
        <div className="w-full text-left">
          <h2 className="mb-2 mt-4 text-lg font-semibold text-gray-900">Your listings</h2>
          <ul className="flex flex-col gap-2">
            {listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/listings/${l.id}`}
                  className="block rounded-xl border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <p className="font-semibold text-gray-900">
                    {typeLabels[l.apartment_type ?? "other"]} · {l.area}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₦{l.contribution_amount?.toLocaleString("en-NG")} per year · {l.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <LogoutButton />
    </main>
  );
}