import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportActions, ReinstateButton } from "./ReportActions";

const typeLabels: Record<string, string> = {
  fake_listing: "Fake listing",
  fraud: "Fraud",
  scam: "Scam",
  harassment: "Harassment",
  other: "Something else",
};

type ReportRow = {
  id: string;
  type: string;
  details: string | null;
  created_at: string;
  listing_id: string | null;
  reported_user_id: string;
  reporter: { full_name: string };
  reported: { full_name: string; is_suspended: boolean };
};
type Suspended = { id: string; full_name: string };

export default async function AdminReportsPage() {
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

  const { data } = await supabase
    .from("reports")
    .select(
      `id, type, details, created_at, listing_id, reported_user_id,
       reporter:profiles!reports_reporter_id_fkey(full_name),
       reported:profiles!reports_reported_user_id_fkey(full_name, is_suspended)`
    )
    .eq("status", "open")
    .order("created_at", { ascending: true });
  const reports = (data ?? []) as unknown as ReportRow[];

  const { data: suspendedRows } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_suspended", true);
  const suspended = (suspendedRows ?? []) as Suspended[];

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold text-gray-900">Admin: reports</h1>

      <h2 className="mb-2 font-semibold text-gray-900">Open reports ({reports.length})</h2>
      {reports.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">No open reports.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-4">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border border-gray-200 p-3">
              <p className="font-semibold text-gray-900">{typeLabels[r.type]}</p>
              <p className="text-sm text-gray-600">
                Reported: <strong>{r.reported?.full_name || "User"}</strong>
                {r.reported?.is_suspended ? " (suspended)" : ""} · by{" "}
                {r.reporter?.full_name || "User"}
              </p>
              {r.details && <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{r.details}</p>}
              {r.listing_id && (
                <Link href={`/listings/${r.listing_id}`} className="mt-2 inline-block text-sm font-semibold text-emerald-700">
                  Open listing →
                </Link>
              )}
              <ReportActions reportId={r.id} reportedUserId={r.reported_user_id} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 font-semibold text-gray-900">Suspended accounts ({suspended.length})</h2>
      {suspended.length === 0 ? (
        <p className="text-sm text-gray-500">No suspended accounts.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {suspended.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-2xl border border-gray-200 p-3">
              <p className="font-semibold text-gray-900">{s.full_name || "User"}</p>
              <ReinstateButton userId={s.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}