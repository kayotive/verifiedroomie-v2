import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/phone";
import { Avatar, EmptyState, Pill } from "@/components/ui";
import { SearchIcon, UsersIcon } from "@/components/icons";
import RequestActions from "./RequestActions";

const genderLabels: Record<string, string> = { male: "Male", female: "Female", other: "Other" };
const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
};
const prefLabels: Record<string, string> = { male: "Male roomie", female: "Female roomie", any: "Any gender" };
const roomiesLabels: Record<number, string> = {
  1: "Wants to be the only roomie",
  2: "Okay with up to 2 roomies",
  3: "Okay with up to 3 roomies",
};
const smokingLabels: Record<string, string> = { non_smoker: "Non-smoker", smoker: "Smoker" };

type Person = {
  full_name: string;
  avatar_url: string | null;
  gender: string | null;
  birth_year: number | null;
  occupation: string | null;
  religion: string | null;
  smoking: string | null;
  bio: string | null;
  roomie_gender_preference: string | null;
  max_roomies: number | null;
};
type Row = {
  id: string;
  status: string;
  requester_id: string;
  receiver_id: string;
  requester: Person;
  receiver: Person;
};

function PersonLine({ p, size = 56 }: { p: Person; size?: number }) {
  const age = p.birth_year ? new Date().getFullYear() - p.birth_year : null;
  const details = [
    p.gender ? genderLabels[p.gender] : null,
    p.occupation ? occupationLabels[p.occupation] : null,
    p.religion,
    p.smoking ? smokingLabels[p.smoking] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3">
      <Avatar src={p.avatar_url} name={p.full_name} size={size} />
      <div className="min-w-0">
        <p className="truncate font-bold text-slate-900">
          {p.full_name || "New user"}
          {age ? `, ${age}` : ""}
        </p>
        {details && <p className="truncate text-sm text-slate-600">{details}</p>}
        <p className="truncate text-xs font-semibold text-brand-700">
  Looking for: {prefLabels[p.roomie_gender_preference ?? "any"]}
</p>
{p.max_roomies && (
  <p className="truncate text-xs font-semibold text-brand-700">
    👥 {roomiesLabels[p.max_roomies]}
  </p>
)}
      </div>
    </div>
  );
}

function SectionTitle({ children, count }: { children: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{children}</h2>
      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
        {count}
      </span>
    </div>
  );
}

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();
  const browseHref = me?.user_type === "owner" ? "/people" : "/feed";

  const personFields = "full_name, avatar_url, gender, birth_year, occupation, religion, smoking, bio, roomie_gender_preference, max_roomies";
  const { data } = await supabase
    .from("connections")
    .select(
      `id, status, requester_id, receiver_id,
       requester:profiles!connections_requester_id_fkey(${personFields}),
       receiver:profiles!connections_receiver_id_fkey(${personFields})`
    )
    .order("created_at", { ascending: false });

  // Skip rows where the other person is no longer visible (for example suspended)
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.requester && r.receiver);
  const incoming = rows.filter((r) => r.receiver_id === user.id && r.status === "pending");
  const accepted = rows.filter((r) => r.status === "accepted");
  const sent = rows.filter((r) => r.requester_id === user.id && r.status !== "accepted");

  const phones = new Map<string, string | null>();
  await Promise.all(
    accepted.map(async (r) => {
      const otherId = r.requester_id === user.id ? r.receiver_id : r.requester_id;
      const { data: num } = await supabase.rpc("get_contact_phone", { p_user: otherId });
      phones.set(r.id, (num as string | null) ?? null);
    })
  );

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Requests</h1>
      <p className="mt-1 text-slate-600">
        Who wants to connect with you, and the people you&apos;ve reached out to.
      </p>

      {/* Waiting for you */}
      <section className="mt-8">
        <SectionTitle count={incoming.length}>Waiting for you</SectionTitle>
        {incoming.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No new requests">
            When someone wants to connect, they&apos;ll show up here.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {incoming.map((r) => (
              <li key={r.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <PersonLine p={r.requester} size={64} />
                {r.requester.bio && (
  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">About</p>
    <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{r.requester.bio}</p>
  </div>
)}
<RequestActions id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Connections */}
      <section className="mt-10">
        <SectionTitle count={accepted.length}>Your connections</SectionTitle>
        {accepted.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="No connections yet"
            action={
              <Link
                href={browseHref}
                className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
              >
                {me?.user_type === "owner" ? "Browse people" : "Browse listings"}
              </Link>
            }
          >
            Once a request is accepted, you&apos;ll see each other&apos;s phone number here.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {accepted.map((r) => {
              const other = r.requester_id === user.id ? r.receiver : r.requester;
              const phone = phones.get(r.id);
              return (
                <li
                  key={r.id}
                  className="rounded-3xl border border-brand-200 bg-brand-50/60 p-5"
                >
                  <PersonLine p={other} size={64} />
                  {phone ? (
                    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
                      <p className="text-xs font-medium text-slate-500">Phone number</p>
                      <p className="text-lg font-bold text-slate-900">{phone}</p>
                      <div className="mt-3 flex gap-2">
                        <a
                          href={`tel:${phone}`}
                          className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                        >
                          Call
                        </a>
                        <a
                          href={whatsappLink(phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 rounded-xl border border-brand-200 px-4 py-2.5 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-600">No phone number on file.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Sent */}
      {sent.length > 0 && (
        <section className="mt-10">
          <SectionTitle count={sent.length}>Requests you sent</SectionTitle>
          <ul className="grid gap-4 md:grid-cols-2">
            {sent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5"
              >
                <PersonLine p={r.receiver} />
                {r.status === "pending" ? (
                  <Pill tone="amber">Waiting</Pill>
                ) : (
                  <Pill>Declined</Pill>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12 text-center">
        <Link href="/blocked" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
          Blocked users
        </Link>
        <span className="mx-3 text-slate-300">·</span>
<Link href="/safety" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
  Safety tips
</Link>
      </div>
    </main>
  );
}
