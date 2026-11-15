import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UnblockButton from "./UnblockButton";

type Blocked = { id: string; full_name: string; avatar_url: string | null };

export default async function BlockedPage() {
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
  const backHref = me?.user_type === "owner" ? "/dashboard" : "/feed";

  const { data } = await supabase.rpc("my_blocked_users");
  const blocked = (data ?? []) as Blocked[];

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href={backHref} className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold text-gray-900">Blocked users</h1>

      {blocked.length === 0 ? (
        <p className="text-sm text-gray-500">You haven&apos;t blocked anyone.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {blocked.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-2xl border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                {b.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                )}
                <p className="font-semibold text-gray-900">{b.full_name || "User"}</p>
              </div>
              <UnblockButton userId={b.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}