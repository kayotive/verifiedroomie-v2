import { createClient } from "@/lib/supabase/server";
import HeaderClient from "./HeaderClient";
import FeedbackButton from "./FeedbackButton";

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <HeaderClient viewer={null} />;

  const { data: p } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, user_type, is_admin, id_verified, is_suspended")
    .eq("id", user.id)
    .single();

  const { count } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <>
      <HeaderClient
        viewer={{
          name: p?.full_name ?? "",
          avatarUrl: p?.avatar_url ?? null,
          role: p?.user_type ?? null,
          isAdmin: !!p?.is_admin,
          idVerified: !!p?.id_verified,
          isSuspended: !!p?.is_suspended,
          pendingRequests: count ?? 0,
          unreadNotifications: unread ?? 0,
        }}
      />
      {/* Feedback button: only for members who finished setup and are not suspended */}
      {p?.user_type && !p?.is_suspended && <FeedbackButton />}
    </>
  );
}