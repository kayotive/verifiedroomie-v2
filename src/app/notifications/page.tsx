import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/components/ui";
import NotificationList from "./NotificationList";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, message, link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (data ?? []).map((n) => ({
    id: n.id as string,
    kind: n.kind as string,
    message: n.message as string,
    link: (n.link as string | null) ?? null,
    read: !!n.read_at,
    when: timeAgo(n.created_at as string),
  }));

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Notifications
      </h1>
      <p className="mt-1 text-slate-600">
        New requests, answers to your requests, and refunded Connect Points.
      </p>

      {error ? (
        <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          Something went wrong loading your notifications: {error.message}
        </p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <p className="font-semibold text-slate-800">Nothing here yet</p>
          <p className="mt-1 text-sm text-slate-600">
            We&apos;ll tell you here when someone sends or answers a request, or when a Connect
            Point is refunded.
          </p>
        </div>
      ) : (
        <NotificationList items={items} />
      )}
    </main>
  );
}