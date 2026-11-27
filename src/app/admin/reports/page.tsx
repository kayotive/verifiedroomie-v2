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
type Suspended = { id: string; full_name: string; suspended_reason: string | null };

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

  // One card per reported person, with all their open reports inside
  const groups = new Map<string, ReportRow[]>();
  for (const r of reports) {
    const list = groups.get(r.reported_user_id) ?? [];
    list.push(r);
    groups.set(r.reported_user_id, list);
  }
  const grouped = Array.from(groups.entries());

  const { data: suspendedRows } = await supabase
    .from("profiles")
    .select("id, full_name, suspended_reason")
    .eq("is_suspended", true);
  const suspended = (suspendedRows ?? []) as Suspended[];

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold text-gray-900">Admin: reports</h1>

      <h2 className="mb-2 font-semibold text-gray-900">
        Open reports ({reports.length}) · {grouped.length} {grouped.length === 1 ? "person" : "people"}
      </h2>
      {grouped.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">No open reports.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-4">
          {grouped.map(([userId, list]) => {
            const first = list[0];
            return (
              <li key={userId} className="rounded-2xl border border-gray-200 p-3">
                <p className="text-lg font-bold text-gray-900">
                  {first.reported?.full_name || "User"}
                  {first.reported?.is_suspended ? (
                    <span className="ml-2 text-sm font-semibold text-red-700">(suspended)</span>
                  ) : null}
                </p>
                <p className="text-sm text-gray-600">
                  {list.length} open report{list.length === 1 ? "" : "s"}
                </p>

                <ul className="mt-3 flex flex-col gap-3">
                  {list.map((r) => (
                    <li key={r.id} className="rounded-xl bg-gray-50 p-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {typeLabels[r.type]}{" "}
                        <span className="font-normal text-gray-500">
                          · by {r.reporter?.full_name || "User"}
                        </span>
                      </p>
                      {r.details && (
                        <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{r.details}</p>
                      )}
                      {r.listing_id && (
                        <Link
                          href={`/listings/${r.listing_id}`}
                          className="mt-1 inline-block text-sm font-semibold text-emerald-700"
                        >
                          Open listing →
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>

                <ReportActions
                  reportIds={list.map((r) => r.id)}
                  reportedUserId={userId}
                  alreadySuspended={!!first.reported?.is_suspended}
                />
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mb-2 font-semibold text-gray-900">Suspended accounts ({suspended.length})</h2>
      {suspended.length === 0 ? (
        <p className="text-sm text-gray-500">No suspended accounts.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {suspended.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 p-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{s.full_name || "User"}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Shown to them:{" "}
                  {s.suspended_reason === "photo"
                    ? "Profile photo did not follow our rules"
                    : s.suspended_reason || "Default message (no reason saved)"}
                </p>
              </div>
              <ReinstateButton userId={s.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}