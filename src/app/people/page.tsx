import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FilterBar from "@/components/FilterBar";
import { Avatar, EmptyState, Pill, SortTabs, activity, isNew, timeAgo } from "@/components/ui";
import { ShieldCheckIcon, UsersIcon } from "@/components/icons";

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
const roomiesLabels: Record<number, string> = {
  1: "Wants to be the only roomie",
  2: "Okay with up to 2 roomies",
  3: "Okay with up to 3 roomies",
};
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
  max_roomies: number | null;
  id_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  last_active_at: string | null;
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
    .select("user_type, connect_points, gender")
    .eq("id", user.id)
    .single();
  if (!me?.user_type) redirect("/onboarding");
  if (me.user_type === "seeker") redirect("/feed");

  const { count: pending } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  const gender = sp.gender ?? "";
  const religion = sp.religion ?? "";
  const smoking = sp.smoking ?? "";
  const roomies = ["1", "2", "3"].includes(sp.roomies ?? "") ? (sp.roomies as string) : "";
  const match = sp.match === "1" ? "1" : "";
  const minAge = parseInt(sp.minAge ?? "");
  const maxAge = parseInt(sp.maxAge ?? "");
  const sort = sortOptions.some((o) => o.value === sp.sort) ? (sp.sort as string) : "recent";
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const year = new Date().getFullYear();

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, gender, birth_year, occupation, religion, smoking, avatar_url, bio, roomie_gender_preference, max_roomies, id_verified, phone_verified, created_at, last_active_at",
      { count: "exact" }
    )
    .eq("user_type", "seeker")
    .eq("is_suspended", false)
.eq("is_paused", false);

  if (gender) query = query.eq("gender", gender);
  if (religion) query = query.eq("religion", religion);
  if (smoking) query = query.eq("smoking", smoking);
  if (roomies) query = query.gte("max_roomies", Number(roomies));
  if (match && me.gender) query = query.in("roomie_gender_preference", [me.gender, "any"]);
  if (!Number.isNaN(maxAge)) query = query.gte("birth_year", year - maxAge);
  if (!Number.isNaN(minAge)) query = query.lte("birth_year", year - minAge);

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
  const filtered = [gender, religion, smoking, roomies, match, sp.minAge, sp.maxAge].some(Boolean);

  function hrefWith(overrides: { page?: number; sort?: string }) {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      match,
      roomies,
      gender,
      religion,
      smoking,
      minAge: sp.minAge,
      maxAge: sp.maxAge,
    };
    for (const [k, v] of Object.entries(current)) if (v) params.set(k, v);
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
                Find a housemate for your space. Newest members first.
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
              action="/people"
              submitLabel="Filter"
              values={{ gender, religion, smoking, roomies, match, minAge: sp.minAge, maxAge: sp.maxAge, sort }}
            />
          </div>
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
                {total} {total === 1 ? "person" : "people"}{" "}
                {filtered ? "match your filters" : "looking right now"}
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
                      Clear all filters
                    </Link>
                  ) : undefined
                }
              >
                {filtered
                  ? "Try fewer filters or a wider age range."
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

                        <p className="mt-3 text-xs font-semibold text-brand-700">
  Looking for: {prefLabels[p.roomie_gender_preference ?? "any"]}
</p>
{p.max_roomies && (
  <p className="mt-1 text-xs font-semibold text-brand-700">
    👥 {roomiesLabels[p.max_roomies]}
  </p>
)}
<p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                          {p.bio || "This member hasn't written a bio yet."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
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
