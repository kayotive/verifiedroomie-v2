import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarZoom from "@/components/AvatarZoom";
import { timeAgo } from "@/components/ui";
import { PhotoReviewActions, PhotoSuspendButton } from "./PhotoActions";

const DAY_MS = 24 * 60 * 60 * 1000;

type Row = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  user_type: string | null;
  created_at: string;
  photo_flagged_at: string | null;
};

const roleLabels: Record<string, string> = {
  owner: "Apartment owner",
  seeker: "Looking for a room",
};

export default async function AdminPhotosPage() {
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

  // Flagged: waiting for the person to change their photo (oldest first)
  const { data: flaggedData } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, user_type, created_at, photo_flagged_at")
    .eq("photo_status", "flagged")
    .eq("is_suspended", false)
    .order("photo_flagged_at", { ascending: true });
  const flagged = (flaggedData ?? []) as Row[];

  // Not checked yet (newest first, 30 at a time)
  const { data: newData, count } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, user_type, created_at, photo_flagged_at", {
      count: "exact",
    })
    .eq("photo_status", "unreviewed")
    .eq("is_suspended", false)
    .eq("is_admin", false)
    .not("avatar_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);
  const unreviewed = (newData ?? []) as Row[];

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold text-gray-900">Admin: profile photos</h1>
      <p className="mb-4 text-sm text-gray-500">
        A photo must be a clear photo of the person. Flag houses, objects, documents or photos with
        text or phone numbers. The person gets a notification and 24 hours to change it.
      </p>

      <h2 className="mb-2 font-semibold text-gray-900">
        Flagged, waiting for a new photo ({flagged.length})
      </h2>
      {flagged.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">No flagged profiles.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-4">
          {flagged.map((r) => {
            const expired =
              !!r.photo_flagged_at && Date.now() - new Date(r.photo_flagged_at).getTime() > DAY_MS;
            return (
              <li key={r.id} className="rounded-2xl border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  {r.avatar_url && <AvatarZoom src={r.avatar_url} name={r.full_name} size={80} />}
                  <div>
                    <p className="font-semibold text-gray-900">{r.full_name || "New user"}</p>
                    <p className="text-sm text-gray-600">{roleLabels[r.user_type ?? ""] ?? ""}</p>
                    <p className={`text-xs font-semibold ${expired ? "text-red-700" : "text-amber-700"}`}>
                      {expired
                        ? `24 hours passed (flagged ${timeAgo(r.photo_flagged_at as string)})`
                        : `Flagged ${r.photo_flagged_at ? timeAgo(r.photo_flagged_at) : ""}`}
                    </p>
                  </div>
                </div>
                <PhotoReviewActions userId={r.id} canFlag={false} />
                <PhotoSuspendButton userId={r.id} />
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mb-2 font-semibold text-gray-900">
        Not checked yet ({count ?? unreviewed.length})
      </h2>
      {unreviewed.length === 0 ? (
        <p className="text-sm text-gray-500">Everything has been checked.</p>
      ) : (
        <>
          {(count ?? 0) > unreviewed.length && (
            <p className="mb-2 text-sm text-gray-500">Showing the newest {unreviewed.length}.</p>
          )}
          <ul className="flex flex-col gap-4">
            {unreviewed.map((r) => (
              <li key={r.id} className="rounded-2xl border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  {r.avatar_url && <AvatarZoom src={r.avatar_url} name={r.full_name} size={80} />}
                  <div>
                    <p className="font-semibold text-gray-900">{r.full_name || "New user"}</p>
                    <p className="text-sm text-gray-600">{roleLabels[r.user_type ?? ""] ?? ""}</p>
                    <p className="text-xs text-gray-500">Joined {timeAgo(r.created_at)}</p>
                  </div>
                </div>
                <PhotoReviewActions userId={r.id} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}