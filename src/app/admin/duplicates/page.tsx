import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Pair = {
  listing_a: string;
  listing_b: string;
  same_photos: number;
  similar_photos: number;
  same_text: boolean;
};
type L = {
  id: string;
  area: string | null;
  apartment_type: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
};

export default async function DuplicatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) redirect("/dashboard");

  const { data: rows, error } = await supabase.rpc("duplicate_listing_report");
  const pairs = (rows ?? []) as Pair[];

  const ids = Array.from(new Set(pairs.flatMap((p) => [p.listing_a, p.listing_b])));
  const { data: ls } = ids.length
    ? await supabase
        .from("listings")
        .select("id, area, apartment_type, created_at, profiles(full_name)")
        .in("id", ids)
    : { data: [] };
  const byId = new Map(((ls ?? []) as unknown as L[]).map((l) => [l.id, l]));

  const card = (id: string) => {
    const l = byId.get(id);
    return (
      <div className="flex-1 rounded-xl bg-gray-50 p-2 text-sm">
        <p className="font-semibold text-gray-900">{l?.profiles?.full_name || "Unknown owner"}</p>
        <p className="text-gray-600">{l?.area ?? ""}</p>
        <Link
          href={`/listings/${id}?from=duplicates`}
          className="mt-1 inline-block font-semibold text-emerald-700"
        >
          Open listing
        </Link>
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href="/admin/verifications" className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold text-gray-900">Admin: possible duplicates</h1>
      <p className="mb-4 text-sm text-gray-500">
        Listings from different accounts that share a photo or the same description. This is a hint,
        not proof. Open both and decide. Only photos uploaded after this feature was added are checked.
      </p>

      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}

      {pairs.length === 0 ? (
        <p className="text-sm text-gray-500">No duplicates found.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pairs.map((p) => (
            <li key={p.listing_a + p.listing_b} className="rounded-2xl border border-gray-200 p-3">
              <p className="mb-2 text-xs font-semibold text-amber-700">
                {[
                  p.same_photos > 0 ? `${p.same_photos} identical photo(s)` : "",
                  p.similar_photos > 0 ? `${p.similar_photos} look-alike photo(s)` : "",
                  p.same_text ? "same description" : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="flex gap-2">
                {card(p.listing_a)}
                {card(p.listing_b)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}