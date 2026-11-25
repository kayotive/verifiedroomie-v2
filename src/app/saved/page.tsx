import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { HomeIcon, SearchIcon } from "@/components/icons";
import RemoveSavedButton from "./RemoveSavedButton";

export const metadata: Metadata = { title: "Saved listings" };

const typeLabels: Record<string, string> = {
  self_contained: "Self-contained",
  "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom",
  "3_bedroom": "3 Bedroom",
  other: "Other",
};

type SavedItem = {
  saved_id: string;
  listing_id: string | null;
  saved_at: string;
  state: "available" | "unavailable" | "deleted";
  reason: string | null;
  apartment_type: string | null;
  area: string | null;
  contribution_amount: number | string | null;
  cover_path: string | null;
  connection: string | null;
  i_sent: boolean | null;
};

function unavailableLabel(reason: string | null) {
  return reason === "found_here" || reason === "found_elsewhere"
    ? "No longer available"
    : "Temporarily unavailable";
}

function requestTag(item: SavedItem) {
  if (item.connection === "pending") return item.i_sent ? "Request sent" : "Request received";
  if (item.connection === "rejected") return "Declined";
  return null;
}

function Tag({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <span className="mt-3 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
      {text}
    </span>
  );
}

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const sp = await searchParams;
  const show = sp.show === "available" || sp.show === "unavailable" ? sp.show : "all";

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
  if (!me?.user_type) redirect("/onboarding");
  if (me.user_type !== "seeker") redirect("/dashboard");

  const { data, error } = await supabase.rpc("get_saved_listings");
  const items = (data ?? []) as SavedItem[];
  const availableCount = items.filter((i) => i.state === "available").length;
  const unavailableCount = items.length - availableCount;
  const visible = items.filter((i) =>
    show === "all" ? true : show === "available" ? i.state === "available" : i.state !== "available"
  );

  const tabs = [
    { key: "all", label: `All (${items.length})`, href: "/saved" },
    { key: "available", label: `Available (${availableCount})`, href: "/saved?show=available" },
    {
      key: "unavailable",
      label: `Unavailable (${unavailableCount})`,
      href: "/saved?show=unavailable",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Saved listings
      </h1>
      <p className="mt-1 text-slate-600">
        Listings you saved to come back to. Once an owner accepts your request, the listing moves
        to your connections on the Requests page.
      </p>

      {error ? (
        <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          Something went wrong loading your saved listings: {error.message}
        </p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={SearchIcon}
            title="No saved listings yet"
            action={
              <Link
                href="/feed"
                className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
              >
                Browse listings
              </Link>
            }
          >
            Tap the heart on a listing to save it here.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  show === t.key
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="mt-8 text-slate-600">Nothing here right now.</p>
          ) : (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((i) => {
                const coverUrl = i.cover_path
                  ? supabase.storage.from("listing-media").getPublicUrl(i.cover_path).data
                      .publicUrl
                  : null;
                const type = typeLabels[i.apartment_type ?? "other"];
                const tag = requestTag(i);

                // Deleted by the owner
                if (i.state === "deleted") {
                  return (
                    <li
                      key={i.saved_id}
                      className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white"
                    >
                      <div className="relative flex aspect-[4/3] items-center justify-center bg-slate-100">
                        <svg
                          className="absolute inset-0 h-full w-full text-slate-300"
                          viewBox="0 0 100 75"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <line x1="0" y1="0" x2="100" y2="75" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                          <line x1="100" y1="0" x2="0" y2="75" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                        </svg>
                        <span className="relative rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm">
                          Deleted
                        </span>
                      </div>
                      <div className="flex-1 p-5">
                        <p className="text-slate-600">Sorry, this listing has been deleted.</p>
                      </div>
                      <div className="border-t border-slate-100 px-5 py-3">
                        <RemoveSavedButton savedId={i.saved_id} />
                      </div>
                    </li>
                  );
                }

                // Hidden, paused, taken, unconfirmed or owner suspended
                if (i.state === "unavailable") {
                  return (
                    <li
                      key={i.saved_id}
                      className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                        {coverUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverUrl}
                            alt=""
                            className="h-full w-full scale-110 object-cover opacity-60 blur-md grayscale"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20">
                          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">
                            {unavailableLabel(i.reason)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-5 opacity-80">
                        <p className="font-bold text-slate-700">{type}</p>
                        <p className="mt-1 truncate text-sm text-slate-500">{i.area}</p>
                        <p className="mt-3 text-xs text-slate-500">
                          This listing can&apos;t be opened right now.
                        </p>
                        <Tag text={tag} />
                      </div>
                      <div className="border-t border-slate-100 px-5 py-3">
                        <RemoveSavedButton savedId={i.saved_id} />
                      </div>
                    </li>
                  );
                }

                // Available
                return (
                  <li
                    key={i.saved_id}
                    className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white"
                  >
                    <Link href={`/listings/${i.listing_id}`} className="group flex flex-1 flex-col">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        {coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverUrl}
                            alt="Apartment"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-brand-300">
                            <HomeIcon className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-5">
                        <p className="text-xl font-extrabold text-slate-900">
                          ₦{Number(i.contribution_amount).toLocaleString("en-NG")}
                          <span className="ml-1 text-sm font-medium text-slate-500">/ year</span>
                        </p>
                        <p className="mt-1 truncate text-slate-700">
                          {type} · {i.area}
                        </p>
                        <Tag text={tag} />
                      </div>
                    </Link>
                    <div className="border-t border-slate-100 px-5 py-3">
                      <RemoveSavedButton savedId={i.saved_id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </main>
  );
}