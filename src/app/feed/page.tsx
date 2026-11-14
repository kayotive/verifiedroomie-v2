import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "../dashboard/LogoutButton";

const PAGE_SIZE = 12;

const typeLabels: Record<string, string> = {
  self_contained: "Self-contained",
  "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom",
  "3_bedroom": "3 Bedroom",
  other: "Other",
};
const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

type Media = { path: string; category: string | null; kind: string };
type FeedListing = {
  id: string;
  apartment_type: string | null;
  area: string | null;
  place_name: string | null;
  contribution_amount: number | null;
  apartment_verified: boolean;
  profiles: {
    full_name: string;
    gender: string | null;
    birth_year: number | null;
    religion: string | null;
    smoking: string | null;
    avatar_url: string | null;
    id_verified: boolean;
    phone_verified: boolean;
  };
  listing_media: Media[];
};

const selectClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
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
  if (!me?.user_type) redirect("/onboarding");
  if (me.user_type === "owner") redirect("/dashboard");

  const { count: pending } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  // Read and clean the search and filter values
  const q = (sp.q ?? "").replace(/[,()%*\\".:]/g, " ").trim();
  const gender = sp.gender ?? "";
  const religion = sp.religion ?? "";
  const smoking = sp.smoking ?? "";
  const minAge = parseInt(sp.minAge ?? "");
  const maxAge = parseInt(sp.maxAge ?? "");
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const year = new Date().getFullYear();

  let query = supabase
    .from("listings")
    .select(
      `id, apartment_type, area, place_name, contribution_amount, apartment_verified,
       profiles!inner(full_name, gender, birth_year, religion, smoking, avatar_url, id_verified, phone_verified),
       listing_media(path, category, kind)`
    )
    .eq("status", "published")
    .eq("room_available", true)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE); // one extra row tells us if there is a next page

  if (q) query = query.or(`place_name.ilike."*${q}*",area.ilike."*${q}*"`);
  if (gender) query = query.eq("profiles.gender", gender);
  if (religion) query = query.eq("profiles.religion", religion);
  if (smoking) query = query.eq("profiles.smoking", smoking);
  if (!Number.isNaN(maxAge)) query = query.gte("profiles.birth_year", year - maxAge);
  if (!Number.isNaN(minAge)) query = query.lte("profiles.birth_year", year - minAge);

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as FeedListing[];
  const hasNext = rows.length > PAGE_SIZE;
  const listings = rows.slice(0, PAGE_SIZE);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      q,
      gender,
      religion,
      smoking,
      minAge: sp.minAge,
      maxAge: sp.maxAge,
    };
    for (const [k, v] of Object.entries(current)) if (v) params.set(k, v);
    params.set("page", String(p));
    return `/feed?${params.toString()}`;
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-700">VerifiedRoomie</h1>
        <LogoutButton />
      </header>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">🎟 Connect Points: {me.connect_points}</span>
        <div className="flex gap-4">
          <Link href="/verify" className="font-semibold text-emerald-700">
            Verify ID
          </Link>
          <Link href="/requests" className="font-semibold text-emerald-700">
            Requests{pending ? ` (${pending})` : ""}
          </Link>
        </div>
      </div>

      <form method="get" className="mb-5 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search area, street, estate, town or landmark"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <select name="gender" defaultValue={gender} className={selectClass}>
            <option value="">Any gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select name="smoking" defaultValue={smoking} className={selectClass}>
            <option value="">Smoking: any</option>
            <option value="non_smoker">Non-smoker</option>
            <option value="smoker">Smoker</option>
          </select>
          <select name="religion" defaultValue={religion} className={selectClass}>
            <option value="">Any religion</option>
            <option value="Christian">Christian</option>
            <option value="Muslim">Muslim</option>
            <option value="Other">Other</option>
          </select>
          <div className="flex gap-2">
            <input name="minAge" type="number" min={18} max={99} defaultValue={sp.minAge} placeholder="Min age" className={selectClass} />
            <input name="maxAge" type="number" min={18} max={99} defaultValue={sp.maxAge} placeholder="Max age" className={selectClass} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
            Search
          </button>
          <Link href="/feed" className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-white">
            Clear
          </Link>
        </div>
      </form>

      <h2 className="mb-3 text-lg font-semibold text-gray-900">Newest listings</h2>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Something went wrong loading listings: {error.message}
        </p>
      )}

      {!error && listings.length === 0 && (
        <p className="rounded-xl bg-gray-50 p-6 text-center text-gray-600">
          No listings match your search yet. Try clearing the filters.
        </p>
      )}

      <ul className="flex flex-col gap-5">
        {listings.map((l) => {
          const photos = l.listing_media.filter((m) => m.kind === "photo");
          const cover = photos.find((m) => m.category === "living_room") ?? photos[0];
          const coverUrl = cover
            ? supabase.storage.from("listing-media").getPublicUrl(cover.path).data.publicUrl
            : null;
          const p = l.profiles;
          const age = p.birth_year ? year - p.birth_year : null;
          const firstName = p.full_name.split(" ")[0];

          const badges = ["📧 Email verified"];
          if (p.phone_verified) badges.push("📱 Phone verified");
          if (p.id_verified) badges.push("🪪 ID verified");
          if (l.apartment_verified) badges.push("🏠 Apartment verified");

          return (
            <li key={l.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative h-48 w-full bg-gray-100">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="Apartment" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No photo
                  </div>
                )}
                {p.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.avatar_url}
                    alt={firstName}
                    className="absolute -bottom-6 left-4 h-14 w-14 rounded-full border-4 border-white object-cover"
                  />
                )}
              </div>

              <div className="p-4 pt-8">
                <p className="text-lg font-bold text-gray-900">
                  ₦{l.contribution_amount?.toLocaleString("en-NG")}{" "}
                  <span className="text-sm font-normal text-gray-500">per year</span>
                </p>
                <p className="text-gray-800">📍 {l.area}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {typeLabels[l.apartment_type ?? "other"]} · {firstName}
                  {age ? `, ${age}` : ""}
                  {p.gender ? ` · ${genderLabels[p.gender]}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {badges.map((b) => (
                    <span key={b} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      {b}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/listings/${l.id}`}
                  className="mt-3 block rounded-xl bg-emerald-600 py-2 text-center font-semibold text-white hover:bg-emerald-700"
                >
                  View Details
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {(page > 1 || hasNext) && (
        <div className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-semibold text-emerald-700">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link href={pageHref(page + 1)} className="font-semibold text-emerald-700">
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}