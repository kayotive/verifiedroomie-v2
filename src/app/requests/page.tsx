import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/phone";
import RequestActions from "./RequestActions";

const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
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
};
type Row = {
  id: string;
  status: string;
  requester_id: string;
  receiver_id: string;
  requester: Person;
  receiver: Person;
};

function PersonLine({ p }: { p: Person }) {
  const age = p.birth_year ? new Date().getFullYear() - p.birth_year : null;
  return (
    <div className="flex items-center gap-3">
      {p.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar_url} alt={p.full_name} className="h-14 w-14 rounded-full object-cover" />
      )}
      <div>
        <p className="font-semibold text-gray-900">
          {p.full_name || "New user"}
          {age ? `, ${age}` : ""}
        </p>
        <p className="text-sm text-gray-600">
          {p.occupation ? occupationLabels[p.occupation] : ""}
          {p.religion ? ` · ${p.religion}` : ""}
          {p.smoking ? ` · ${smokingLabels[p.smoking]}` : ""}
        </p>
      </div>
    </div>
  );
}

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const personFields = "full_name, avatar_url, gender, birth_year, occupation, religion, smoking";
  const { data } = await supabase
    .from("connections")
    .select(
      `id, status, requester_id, receiver_id,
       requester:profiles!connections_requester_id_fkey(${personFields}),
       receiver:profiles!connections_receiver_id_fkey(${personFields})`
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
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

  const statusText: Record<string, string> = {
    pending: "Waiting for a reply",
    rejected: "Declined",
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold text-gray-900">Requests</h1>

      <h2 className="mb-2 font-semibold text-gray-900">Waiting for you</h2>
      {incoming.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">No new requests.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-3">
          {incoming.map((r) => (
            <li key={r.id} className="rounded-2xl border border-gray-200 p-3">
              <PersonLine p={r.requester} />
              <RequestActions id={r.id} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 font-semibold text-gray-900">Your connections</h2>
      {accepted.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">No connections yet.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-3">
          {accepted.map((r) => {
            const other = r.requester_id === user.id ? r.receiver : r.requester;
            const phone = phones.get(r.id);
            return (
              <li key={r.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                <PersonLine p={other} />
                {phone ? (
                  <div className="mt-2 flex items-center gap-4">
                    <span className="font-medium text-gray-800">{phone}</span>
                    <a href={`tel:${phone}`} className="text-sm font-semibold text-emerald-700">Call</a>
                    <a href={whatsappLink(phone)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700">
                      WhatsApp
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">No phone number on file.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {sent.length > 0 && (
        <>
          <h2 className="mb-2 font-semibold text-gray-900">Requests you sent</h2>
          <ul className="flex flex-col gap-3">
            {sent.map((r) => (
              <li key={r.id} className="rounded-2xl border border-gray-200 p-3">
                <PersonLine p={r.receiver} />
                <p className="mt-1 text-sm text-gray-500">{statusText[r.status] ?? r.status}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}