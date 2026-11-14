import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "../dashboard/LogoutButton";

const PAGE_SIZE = 12;

const genderLabels: Record<string, string> = { male: "Male", female: "Female", other: "Other" };
const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
};
const smokingLabels: Record<string, string> = { non_smoker: "Non-smoker", smoker: "Smoker" };

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
  id_verified: boolean;
  phone_verified: boolean;
};

const selectClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none";

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

  const gender = sp.gender ?? "";
  const religion = sp.religion ?? "";
  const smoking = sp.smoking ?? "";
  const minAge = parseInt(sp.minAge ?? "");
  const maxAge = parseInt(sp.maxAge ?? "");
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const year = new Date().getFullYear();

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, gender, birth_year, occupation, religion, smoking, avatar_url, bio, id_verified, phone_verified"
    )
    .eq("user_type", "seeker")
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE); // one extra row tells us if there is a next page

  if (gender) query = query.eq("gender", gender);
  if (religion) query = query.eq("religion", religion);
  if (smoking) query = query.eq("smoking", smoking);
  if (!Number.isNaN(maxAge)) query = query.gte("birth_year", year - maxAge);
  if (!Number.isNaN(minAge)) query = query.lte("birth_year", year - minAge);

  const { data, error } = await query;
  const rows = (data ?? []) as Person[];
  const hasNext = rows.length > PAGE_SIZE;
  const people = rows.slice(0, PAGE_SIZE);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      gender,
      religion,
      smoking,
      minAge: sp.minAge,
      maxAge: sp.maxAge,
    };
    for (const [k, v] of Object.entries(current)) if (v) params.set(k, v);
    params.set("page", String(p));
    return `/people?${params.toString()}`;
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-700">People looking</h1>
        <LogoutButton />
      </header>
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">🎟 Connect Points: {me.connect_points}</span>
        <div className="flex gap-4">
          <Link href="/dashboard" className="font-semibold text-emerald-700">Dashboard</Link>
          <Link href="/requests" className="font-semibold text-emerald-700">Requests</Link>
        </div>
      </div>

      <form method="get" className="mb-5 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
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
            Filter
          </button>
          <Link href="/people" className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-white">
            Clear
          </Link>
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Something went wrong loading people: {error.message}
        </p>
      )}

      {!error && people.length === 0 && (
        <p className="rounded-xl bg-gray-50 p-6 text-center text-gray-600">
          No one matches yet. Try clearing the filters.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {people.map((p) => {
          const age = p.birth_year ? year - p.birth_year : null;
          const firstName = p.full_name.split(" ")[0] || "New user";
          const badges = ["📧 Email verified"];
          if (p.phone_verified) badges.push("📱 Phone verified");
          if (p.id_verified) badges.push("🪪 ID verified");

          return (
            <li key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                {p.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt={firstName} className="h-20 w-20 rounded-full object-cover" />
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

              {p.bio && <p className="mt-2 line-clamp-2 text-sm text-gray-700">{p.bio}</p>}

              <div className="mt-2 flex flex-wrap gap-1">
                {badges.map((b) => (
                  <span key={b} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {b}
                  </span>
                ))}
              </div>

              <Link
                href={`/people/${p.id}`}
                className="mt-3 block rounded-xl bg-emerald-600 py-2 text-center font-semibold text-white hover:bg-emerald-700"
              >
                View Profile
              </Link>
            </li>
          );
        })}
      </ul>

      {(page > 1 || hasNext) && (
        <div className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-semibold text-emerald-700">← Previous</Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link href={pageHref(page + 1)} className="font-semibold text-emerald-700">Next →</Link>
          )}
        </div>
      )}
    </main>
  );
}