"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type NotificationItem = {
  id: string;
  kind: string;
  message: string;
  link: string | null;
  read: boolean;
  when: string;
};

const icons: Record<string, string> = {
  refund: "🪙",
  request_received: "📩",
  request_accepted: "🎉",
  request_declined: "🚫",

  id_verified: "✅",
  id_rejected: "⚠️",
  photo_flagged: "📷",
};

export default function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();

  // Remember which ones were new when the page opened, so they stay highlighted
  const [newIds] = useState(() => new Set(items.filter((i) => !i.read).map((i) => i.id)));

  // Mark them as read once they have been seen, then refresh the header count
  useEffect(() => {
    if (newIds.size === 0) return;
    createClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", Array.from(newIds))
      .then(({ error }) => {
        if (!error) router.refresh();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {items.map((n) => {
        const isNew = newIds.has(n.id);
        const body = (
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              isNew ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"
            }`}
          >
            <span className="text-xl" aria-hidden="true">
              {icons[n.kind] ?? "🔔"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-800">{n.message}</p>
              <p className="mt-1 text-xs text-slate-500">{n.when}</p>
            </div>
            {isNew && (
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600"
                aria-label="New"
              />
            )}
          </div>
        );
        return (
          <li key={n.id}>
            {n.link ? (
              <Link href={n.link} className="block transition hover:opacity-90">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}