import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FilterBar from "@/components/FilterBar";
 import ShowProfileButton from "./ShowProfileButton";
import {
  Avatar,
  EmptyState,
  SortTabs,
  activity,
  isNew,
  timeAgo,
} from "@/components/ui";
import {
  HomeIcon,
  MapPinIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/icons";

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
const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
};
const prefLabels: Record<string, string> = { male: "Male roomie", female: "Female roomie", any: "Any gender" };
const sortOptions = [
  { value: "recent", label: "Most recent" },
  { value: "active", label: "Recently active" },
  { value: "oldest", label: "Oldest first" },
];

type Media = { path: string; category: string | null; kind: string };
type FeedListing = {
  id: string;
  apartment_type: string | null;
  area: string | null;
  place_name: string | null;
  contribution_amount: number | null;
  move_in_date: string | null;
  roomies_wanted: number;
  apartment_verified: boolean;
  created_at: string;
  last_active_at: string | null;
  profiles: {
    full_name: string;
    gender: string | null;
    birth_year: number | null;
    occupation: string | null;
    avatar_url: string | null;
    bio: string | null;
    roomie_gender_preference: string | null;
    id_verified: boolean;
    phone_verified: boolean;
  };
  listing_media: Media[];
};

function moveInLabel(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  if (d.getTime() <= Date.now()) return "Available now";
  return `Available from ${d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

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
     .select("user_type, connect_points, max_roomies, gender, is_paused")
    .eq("id", user.id)
    .single();
  if (!me?.user_type) redirect("/onboarding");
  if (me.user_type === "owner") redirect("/dashboard");

  const { count: pending } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  // Read and clean the search, filter and sort values
  const q = (sp.q ?? "").replace(/[,()%*\\".:]/g, " ").trim();
  const type = typeLabels[sp.type ?? ""] ? (sp.type as string) : "";
  const gender = sp.gender ?? "";
  const religion = sp.religion ?? "";
  const smoking = sp.smoking ?? "";
  const roomies = ["1", "2", "3"].includes(sp.roomies ?? "") ? (sp.roomies as string) : "";
  const match = sp.match === "1" ? "1" : "";
  const minAge = parseInt(sp.minAge ?? "");
  const maxAge = parseInt(sp.maxAge ?? "");
  const minBudget = parseInt(sp.minBudget ?? "");
  const maxBudget = parseInt(sp.maxBudget ?? "");
  const sort = sortOptions.some((o) => o.value === sp.sort) ? (sp.sort as string) : "recent";
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const year = new Date().getFullYear();
  const staleCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("listings")
    .select(
      `id, apartment_type, area, place_name, contribution_amount, roomies_wanted, move_in_date, apartment_verified, created_at, last_active_at,
       profiles!inner(full_name, gender, birth_year, occupation, avatar_url, bio, roomie_gender_preference, id_verified, phone_verified),
       listing_media(path, category, kind)`,
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("room_available", true)
.gte("last_confirmed_at", staleCutoff);

  if (q) query = query.or(`place_name.ilike."*${q}*",area.ilike."*${q}*"`);
  if (type) query = query.eq("apartment_type", type);
  if (!Number.isNaN(minBudget)) query = query.gte("contribution_amount", minBudget);
  if (!Number.isNaN(maxBudget)) query = query.lte("contribution_amount", maxBudget);
  if (gender) query = query.eq("profiles.gender", gender);
  if (religion) query = query.eq("profiles.religion", religion);
  if (smoking) query = query.eq("profiles.smoking", smoking);
  if (roomies) query = query.lte("roomies_wanted", Number(roomies));
  if (match && me.gender) query = query.in("profiles.roomie_gender_preference", [me.gender, "any"]);
  if (!Number.isNaN(maxAge)) query = query.gte("profiles.birth_year", year - maxAge);
  if (!Number.isNaN(minAge)) query = query.lte("profiles.birth_year", year - minAge);

  // Sorting uses real timestamps from the database
  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "active") {
    query = query
      .order("last_active_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  const listings = (data ?? []) as unknown as FeedListing[];
  const total = count ?? listings.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = [
    match,
    roomies,
    q,
    type,
    gender,
    religion,
    smoking,
    sp.minAge,
    sp.maxAge,
    sp.minBudget,
    sp.maxBudget,
  ].some(Boolean);

  function hrefWith(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      match,
      roomies,
      q,
      type,
      gender,
      religion,
      smoking,
      minAge: sp.minAge,
      maxAge: sp.maxAge,
      minBudget: sp.minBudget,
      maxBudget: sp.maxBudget,
    };
    for (const [k, v] of Object.entries(current)) if (v) params.set(k, v);
    const nextSort = overrides.sort ?? sort;
    if (nextSort !== "recent") params.set("sort", nextSort);
    if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));
    const qs = params.toString();
    return qs ? `/feed?${qs}` : "/feed";
  }

  return (
    <main>
      {me.is_paused && (
     <div className="border-b border-amber-200 bg-amber-50">
       <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
         <p className="text-sm font-medium text-amber-900">
           🔒 Your profile is hidden from owners.
         </p>
         <ShowProfileButton />
       </div>
     </div>
   )}
      <section className="border-b border-slate-100 bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Find your room
              </h1>
              <p className="mt-1 text-slate-600">
                Verified hosts with space to share. Search by area, budget and who you&apos;d like to live with.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                <span className="h-2 w-2 rounded-full bg-brand-600" />
                {me.connect_points} Connect Points
              </span>
              {!!pending && (
                <Link
                  href="/requests"
                  className="inline-flex items-center rounded-full bg-brand-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                  {pending} new request{pending === 1 ? "" : "s"}
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6">
            <FilterBar
              action="/feed"
              showHousing
              searchPlaceholder="Area, street, estate, town or landmark"
              values={{
                match,
                roomies,
                q,
                type,
                gender,
                religion,
                smoking,
                minAge: sp.minAge,
                maxAge: sp.maxAge,
                minBudget: sp.minBudget,
                maxBudget: sp.maxBudget,
                sort,
              }}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            Something went wrong loading listings: {error.message}
          </p>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">
                {total} listing{total === 1 ? "" : "s"}{" "}
                {filtered ? "match your search" : "available right now"}
                {me.max_roomies && String(me.max_roomies) !== roomies && (
  <>
    {" · "}
    <Link
      href={`/feed?roomies=${me.max_roomies}`}
      className="font-semibold text-brand-700 hover:text-brand-800"
    >
      Show listings that fit me
    </Link>
  </>
)}
              </p>
              <SortTabs
                options={sortOptions}
                current={sort}
                hrefFor={(value) => hrefWith({ sort: value })}
              />
            </div>

            {listings.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title="No listings match yet"
                action={
                  filtered ? (
                    <Link
                      href="/feed"
                      className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
                    >
                      Clear all filters
                    </Link>
                  ) : undefined
                }
              >
                {filtered
                  ? "Try a wider area, a higher budget or fewer filters."
                  : "New rooms are added all the time. Check back soon."}
              </EmptyState>
            ) : (
              <ul className="vr-rise grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((l) => {
                  const photos = l.listing_media.filter((m) => m.kind === "photo");
                  const cover =
                    photos.find((m) => m.category === "living_room") ?? photos[0];
                  const coverUrl = cover
                    ? supabase.storage.from("listing-media").getPublicUrl(cover.path).data
                        .publicUrl
                    : null;
                  const p = l.profiles;
                  const age = p.birth_year ? year - p.birth_year : null;
                  const firstName = p.full_name.split(" ")[0] || "Host";
                  const act = activity(l.last_active_at);
                  const moveIn = moveInLabel(l.move_in_date);

                  return (
                    <li key={l.id}>
                      <Link
                        href={`/listings/${l.id}`}
                        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                          {coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={coverUrl}
                              alt="Apartment"
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-linear-to-br from-brand-50 to-brand-100 text-brand-300">
                              <HomeIcon className="h-12 w-12" />
                            </div>
                          )}
                          {isNew(l.created_at) && (
                            <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                              New listing
                            </span>
                          )}
                          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                            {typeLabels[l.apartment_type ?? "other"]}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <p className="text-xl font-extrabold text-slate-900">
                            ₦{l.contribution_amount?.toLocaleString("en-NG")}
                            <span className="ml-1 text-sm font-medium text-slate-500">/ year</span>
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-slate-700">
                            <MapPinIcon className="h-4 w-4 shrink-0 text-brand-600" />
                            <span className="truncate">{l.area}</span>
                          </p>
                          <p className="mt-2 flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
  👥 Accepting {l.roomies_wanted} {l.roomies_wanted === 1 ? "roomie" : "roomies"}
</p>
<div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span>{moveIn}</span>
                            {act && (
                              <span className="inline-flex items-center gap-1">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    act.recent ? "bg-green-500" : "bg-slate-300"
                                  }`}
                                />
                                {act.label}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                            <Avatar src={p.avatar_url} name={p.full_name} size={40} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {firstName}
                                {age ? `, ${age}` : ""}
                                {p.gender ? ` · ${genderLabels[p.gender]}` : ""}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {p.occupation ? `${occupationLabels[p.occupation]} · ` : ""}
                                Posted {timeAgo(l.created_at)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-xs font-semibold text-brand-700">
  Looking for: {prefLabels[p.roomie_gender_preference ?? "any"]}
</p>
{p.bio && (
  <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-slate-600">
    {p.bio}
  </p>
)}
<div className="mt-3 flex flex-wrap gap-1.5">
                            {p.id_verified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
                                <ShieldCheckIcon className="h-3.5 w-3.5" /> ID verified
                              </span>
                            )}
                            {l.apartment_verified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
                                <HomeIcon className="h-3.5 w-3.5" /> Apartment verified
                              </span>
                            )}
                            {!p.id_verified && !l.apartment_verified && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                Email verified
                              </span>
                            )}
                          </div>

                          <span className="mt-4 text-sm font-semibold text-brand-700 transition group-hover:translate-x-0.5">
                            View details →
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-between" aria-label="Pages">
                {page > 1 ? (
                  <Link
                    href={hrefWith({ page: page - 1 })}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={hrefWith({ page: page + 1 })}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    Next →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
