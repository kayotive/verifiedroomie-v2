import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IdReviewActions, ApartmentVerifyButton } from "./AdminButtons";

const docLabels: Record<string, string> = {
  nin: "NIN",
  passport: "International Passport",
  drivers_licence: "Driver's Licence",
  voters_card: "Voter's Card",
};
const typeLabels: Record<string, string> = {
  self_contained: "Self-contained",
  "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom",
  "3_bedroom": "3 Bedroom",
  other: "Other",
};

type PendingId = {
  id: string;
  document_type: string;
  document_path: string;
  created_at: string;
  profiles: { full_name: string };
};
type ListingRow = {
  id: string;
  area: string | null;
  place_name: string | null;
  apartment_type: string | null;
  profiles: { full_name: string };
};

export default async function AdminVerificationsPage() {
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

  const { data: idRows } = await supabase
    .from("id_verifications")
    .select("id, document_type, document_path, created_at, profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const pending = (idRows ?? []) as unknown as PendingId[];

  // Short-lived private links (5 minutes) so documents are never public
  const docs = await Promise.all(
    pending.map(async (r) => {
      const { data } = await supabase.storage
        .from("id-documents")
        .createSignedUrl(r.document_path, 300);
      return { ...r, url: data?.signedUrl ?? null };
    })
  );

  const { data: listingRows } = await supabase
    .from("listings")
    .select("id, area, place_name, apartment_type, profiles(full_name)")
    .eq("status", "published")
    .eq("apartment_verified", false)
    .order("created_at", { ascending: true });
  const listings = (listingRows ?? []) as unknown as ListingRow[];

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold text-gray-900">Admin: verifications</h1>

      <h2 className="mb-2 font-semibold text-gray-900">ID documents waiting ({docs.length})</h2>
      {docs.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">Nothing waiting for review.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-4">
          {docs.map((d) => (
            <li key={d.id} className="rounded-2xl border border-gray-200 p-3">
              <p className="font-semibold text-gray-900">{d.profiles.full_name || "New user"}</p>
              <p className="text-sm text-gray-600">{docLabels[d.document_type]}</p>
              {d.url ? (
                d.document_path.toLowerCase().endsWith(".pdf") ? (
                  <a href={d.url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-emerald-700">
                    Open PDF →
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.url} alt="ID document" className="mt-2 w-full rounded-xl border border-gray-200" />
                )
              ) : (
                <p className="mt-2 text-sm text-red-700">Could not load the document.</p>
              )}
              <IdReviewActions id={d.id} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 font-semibold text-gray-900">
        Apartments not yet verified ({listings.length})
      </h2>
      <p className="mb-2 text-sm text-gray-500">
        Open the listing, check the photos, video and location, then mark it verified.
      </p>
      {listings.length === 0 ? (
        <p className="text-sm text-gray-500">No unverified listings.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((l) => (
            <li key={l.id} className="rounded-2xl border border-gray-200 p-3">
              <p className="font-semibold text-gray-900">
                {typeLabels[l.apartment_type ?? "other"]} · {l.area}
              </p>
              <p className="text-sm text-gray-600">
                {l.place_name} · owner: {l.profiles.full_name || "New user"}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <Link href={`/listings/${l.id}`} className="text-sm font-semibold text-emerald-700">
                  Open listing
                </Link>
                <ApartmentVerifyButton listingId={l.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}