import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SearchFilters from "@/components/SearchFilters";
import { Avatar, EmptyState, Pill, SortTabs, activity, isNew, timeAgo } from "@/components/ui";
import { ShieldCheckIcon, UsersIcon } from "@/components/icons";
import PhotoVerifiedBadge from "@/components/PhotoVerifiedBadge";
import { LOCATIONS, lookingText } from "@/lib/locations";
import { TYPE_OPTIONS } from "@/lib/apartmentTypes";

const PAGE_SIZE = 12;

const genderLabels: Record<string, string> = { male: "Male", female: "Female", other: "Other" };
const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
};
const smokingLabels: Record<string, string> = { non_smoker: "Non-smoker", smoker: "Smoker" };
const prefLabels: Record<string, string> = { male: "Male roomie", female: "Female roomie", any: "Any gender" };
const sortOptions = [
  { value: "recent", label: "Newest members" },
  { value: "active", label: "Recently active" },
  { value: "oldest", label: "Oldest first" },
];

type Person = {
  id: string;
  full_name: string;
  gender: string | null;
  birth_year: number | null;
  occupation: string | null;
  religion: string | null;
  smoking: string | null;
  avatar_url: string | null;
  bio: string | null;
  roomie_gender_preference: string | null;
  looking_state: string | null;
  looking_area: string | null;
  looking_types: string[] | null;
  id_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  last_active_at: string | null;
  photo_status: string | null;
};

export default async function PeoplePage({
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
  if (me.user_type === "seeker") redirect("/feed");

  const { count: pending } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  // Search: a state first, then (optionally) an area in that state
  const loc = LOCATIONS.find((l) => l.state === sp.state);
  const state = loc ? loc.state : "";
  const area = loc && loc.areas.includes(sp.area ?? "") ? (sp.area as string) : "";
  const sort = sortOptions.some((o) => o.value === sp.sort) ? (sp.sort as string) : "recent";
  const gm = /^(is|pref)_(male|female)$/.exec(sp.gender ?? "");
  const gender = gm ? (sp.gender as string) : "";
  const gMode = gm ? gm[1] : "";
  const gValue = gm ? gm[2] : "";
  const type = TYPE_OPTIONS.some((o) => o.value === sp.type) ? (sp.type as string) : "";
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const year = new Date().getFullYear();

  // The owner's own listing, for the "near your listing" shortcut
  const { data: myListing } = await supabase
    .from("listings")
    .select("state, area")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const myLoc = LOCATIONS.find((l) => l.state === myListing?.state);
  const myAreaName = myListing?.area ? String(myListing.area).split(",")[0].trim() : "";
  const myArea = myLoc && myLoc.areas.includes(myAreaName) ? myAreaName : null;
  const nearHref = myLoc
    ? `/people?state=${encodeURIComponent(myLoc.state)}${
        myArea ? `&area=${encodeURIComponent(myArea)}` : ""
      }${gender ? `&gender=${gender}` : ""}${type ? `&type=${type}` : ""}`
    : null;
  const nearLabel = myLoc ? lookingText(myLoc.state, myArea) : "";

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, gender, birth_year, occupation, religion, smoking, avatar_url, bio, roomie_gender_preference, looking_state, looking_area, looking_types, id_verified, phone_verified, created_at, last_active_at, photo_status",
      { count: "exact" }
    )
    .eq("user_type", "seeker")
    .eq("is_suspended", false)
    .eq("is_paused", false)
    .neq("photo_status", "flagged");

  // Seekers looking in this state, and in this area (or anywhere in the state)
  if (loc) query = query.eq("looking_state", loc.state);
  // Area and apartment type both allow "not specified", so they are combined into one filter
  const areaConds = loc && area ? [`looking_area.eq."${area}"`, "looking_area.is.null"] : [];
  const typeConds = type ? ["looking_types.eq.{}", `looking_types.cs.{${type}}`] : [];
  if (areaConds.length && typeConds.length) {
    query = query.or(
      areaConds.flatMap((a) => typeConds.map((t) => `and(${a},${t})`)).join(",")
    );
  } else if (areaConds.length || typeConds.length) {
    query = query.or([...areaConds, ...typeConds].join(","));
  }

  // Gender: "is_" = the seeker's own gender, "pref_" = wants that gender (or any)
  if (gMode === "is") {
    query = query.eq("gender", gValue);
  } else if (gMode === "pref") {
    query = query.in("roomie_gender_preference", [gValue, "any"]);
  }

  // Hide anyone blocked in either direction
  const { data: hiddenData } = await supabase.rpc("hidden_user_ids");
  const hidden = (hiddenData ?? []) as string[];
  if (hidden.length > 0) {
    query = query.not("id", "in", `(${hidden.join(",")})`);
  }

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
  const people = (data ?? []) as Person[];
  const total = count ?? people.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = !!(loc || gender || type);
  const where = loc ? lookingText(state, area || null) : "";
  const summary = [
    where ? `looking in ${where}` : "",
    gender
      ? gMode === "is"
        ? gValue === "male"
          ? "male"
          : "female"
        : `wanting a ${gValue} housemate (or any)`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const typeLabel = TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "";
  const fullSummary = [summary, typeLabel ? `open to ${typeLabel}` : ""].filter(Boolean).join(" · ");

  function hrefWith(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (area) params.set("area", area);
    if (gender) params.set("gender", gender);
    if (type) params.set("type", type);
    const nextSort = overrides.sort ?? sort;
    if (nextSort !== "recent") params.set("sort", nextSort);
    if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));
    const qs = params.toString();
    return qs ? `/people?${qs}` : "/people";
  }

  return (
    <main>
      <section className="border-b border-slate-100 bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                People looking for a place
              </h1>
              <p className="mt-1 text-slate-600">
                Find a housemate for your space. Pick a city or town, then an area, to see who is looking
                there.
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
            <SearchFilters
              mode="people"
              action="/people"
              state={state}
              area={area}
              gender={gender}
              type={type}
              sort={sort}
            />
          </div>
          {!loc && nearHref && (
            <p className="mt-3 text-sm">
              <Link
                href={nearHref}
                className="font-semibold text-brand-700 hover:text-brand-800"
              >
                📍 Show seekers looking for rooms in {nearLabel}
              </Link>
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {error ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            Something went wrong loading people: {error.message}
          </p>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-600">
                {total} {total === 1 ? "seeker" : "seekers"}{" "}
                {filtered ? `match your search${fullSummary ? ` (${fullSummary})` : ""}` : "looking at listings right now"}
              </p>
              <SortTabs
                options={sortOptions}
                current={sort}
                hrefFor={(value) => hrefWith({ sort: value })}
              />
            </div>

            {people.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="No one matches yet"
                action={
                  filtered ? (
                    <Link
                      href="/people"
                      className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
                    >
                      Clear search
                    </Link>
                  ) : undefined
                }
              >
                {filtered
                  ? "No one matches yet. Try another area or gender, or choose Anywhere."
                  : "New people join all the time. Check back soon."}
              </EmptyState>
            ) : (
              <ul className="vr-rise grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {people.map((p) => {
                  const age = p.birth_year ? year - p.birth_year : null;
                  const firstName = p.full_name.split(" ")[0] || "New member";
                  const act = activity(p.last_active_at);

                  return (
                    <li key={p.id}>
                      <Link
                        href={`/people/${p.id}`}
                        className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar
                            src={p.avatar_url}
                            name={p.full_name}
                            size={72}
                            className="ring-4 ring-brand-50"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-lg font-bold text-slate-900">
                                {firstName}
                                {age ? `, ${age}` : ""}
                              </p>
                              {isNew(p.created_at) && <Pill tone="solid">New member</Pill>}
                            </div>
                            <p className="text-sm text-slate-600">
                              {[
                                p.gender ? genderLabels[p.gender] : null,
                                p.occupation ? occupationLabels[p.occupation] : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {p.religion && <Pill>{p.religion}</Pill>}
                              {p.smoking && <Pill>{smokingLabels[p.smoking]}</Pill>}
                            </div>
                          </div>
                        </div>

                        {p.looking_state && (
                          <p className="mt-3 text-xs font-semibold text-brand-700">
                            📍 Looking in: {lookingText(p.looking_state, p.looking_area)}
                          </p>
                        )}
                        {(p.looking_types ?? []).length > 0 && (
                          <p className="mt-1 text-xs font-semibold text-brand-700">
                            🏢 Open to:{" "}
                            {TYPE_OPTIONS.filter((o) => (p.looking_types ?? []).includes(o.value))
                              .map((o) => o.label)
                              .join(", ")}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-semibold text-brand-700">
                          Looking for: {prefLabels[p.roomie_gender_preference ?? "any"]}
                        </p>
                        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                          {p.bio || "This member hasn't written a bio yet."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          <PhotoVerifiedBadge show={p.photo_status === "approved"} />
                          {p.id_verified && (
                            <Pill tone="brand">
                              <ShieldCheckIcon className="h-3.5 w-3.5" /> ID verified
                            </Pill>
                          )}
                          {p.phone_verified && <Pill tone="brand">Phone verified</Pill>}
                          {!p.id_verified && !p.phone_verified && <Pill>Email verified</Pill>}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                          <span className="flex flex-col text-slate-500">
                            <span>Joined {timeAgo(p.created_at)}</span>
                            {act && (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    act.recent ? "bg-green-500" : "bg-slate-300"
                                  }`}
                                />
                                {act.label}
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-brand-700 transition group-hover:translate-x-0.5">
                            View profile →
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