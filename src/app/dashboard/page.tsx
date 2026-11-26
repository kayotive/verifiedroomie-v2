import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, EmptyState, Pill } from "@/components/ui";
import StillAvailableButton from "./StillAvailableButton";
import {
  FlagIcon,
  HomeIcon,
  MapPinIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/icons";

// Camera icon for the "Admin: photos" tile
function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

const typeLabels: Record<string, string> = {
  self_contained: "Self-contained",
  "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom",
  "3_bedroom": "3 Bedroom",
  other: "Other",
};

type Media = { path: string; category: string | null; kind: string };
type MyListing = {
  id: string;
  apartment_type: string | null;
  area: string | null;
  contribution_amount: number | null;
  status: string;
  room_available: boolean;
  hidden_reason: string | null;
last_confirmed_at: string;
  listing_media: Media[];
};

const STALE_DAYS = 30;
const REMIND_DAYS = 14;

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
}
function Tile({
  href,
  icon: Icon,
  title,
  body,
  badge,
}: {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
        <Icon className="h-6 w-6" />
      </span>
      <span>
        <span className="flex items-center gap-2 font-bold text-slate-900">
          {title}
          {!!badge && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-slate-600">{body}</span>
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, avatar_url, connect_points, is_admin, id_verified")
    .eq("id", user.id)
    .single();

  if (!profile?.user_type) redirect("/onboarding");
  if (profile.user_type === "seeker") redirect("/feed");

  const { data } = await supabase
    .from("listings")
    .select(
      "id, apartment_type, area, contribution_amount, status, room_available, hidden_reason, last_confirmed_at, listing_media(path, category, kind)"
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const listings = (data ?? []) as unknown as MyListing[];
  const needsConfirm = listings.filter(
  (l) =>
    l.status === "published" &&
    l.room_available &&
    daysSince(l.last_confirmed_at) >= REMIND_DAYS
);

  const { count: pending } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending");

  const firstName = profile.full_name.split(" ")[0] || "there";

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 to-brand-800 p-6 text-white shadow-card sm:p-8">
        <div aria-hidden="true" className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden="true" className="absolute -bottom-20 right-32 h-44 w-44 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              size={72}
              className="ring-4 ring-white/30"
            />
            <div>
              <p className="text-sm text-brand-100">Welcome back</p>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{firstName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/15 px-3 py-1">
                  {profile.connect_points} Connect Points
                </span>
                {profile.id_verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                    <ShieldCheckIcon className="h-3.5 w-3.5" /> ID verified
                  </span>
                ) : (
                  <Link
                    href="/verify"
                    className="rounded-full bg-white px-3 py-1 text-brand-700 transition hover:bg-brand-50"
                  >
                    Verify your ID
                  </Link>
                )}
              </div>
            </div>
          </div>
          {listings.length === 0 && (
            <Link
            href="/listings/new"
            className="rounded-xl bg-white px-5 py-3 font-semibold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            + Create listing
          </Link>
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          href="/requests"
          icon={UsersIcon}
          title="Requests"
          body="Review who wants to connect with you."
          badge={pending ?? 0}
        />
        <Tile
          href="/people"
          icon={SearchIcon}
          title="Browse people"
          body="Find a housemate looking for a place."
        />
        <Tile
          href="/profile"
          icon={HomeIcon}
          title="My profile"
          body="Update your details, bio and photo."
        />
        {profile.is_admin && (
          <>
            <Tile
              href="/admin/verifications"
              icon={ShieldCheckIcon}
              title="Admin: verifications"
              body="Review ID documents and apartments."
            />
            <Tile
              href="/admin/reports"
              icon={FlagIcon}
              title="Admin: reports"
              body="Handle reports and suspensions."
            />
            <Tile
              href="/admin/photos"
              icon={CameraIcon}
              title="Admin: photos"
              body="Review profile photos and flag the ones that break the rules."
            />
          </>
        )}
      </section>

      {needsConfirm.length > 0 && (
  <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5">
    <h2 className="font-extrabold text-amber-900">Is your room still available?</h2>
    <p className="mt-1 text-sm text-amber-900">
      Tap to confirm, so seekers know your listing is up to date. Listings not confirmed for{" "}
      {STALE_DAYS} days are hidden from the feed.
    </p>
    <ul className="mt-3 flex flex-col gap-2">
      {needsConfirm.map((l) => (
        <li
          key={l.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-3"
        >
          <span className="text-sm font-semibold text-slate-800">
            {typeLabels[l.apartment_type ?? "other"]} · {l.area}
          </span>
          <StillAvailableButton listingId={l.id} />
        </li>
      ))}
    </ul>
  </section>
)}
{/* Listings */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Your listings</h2>
          
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={HomeIcon}
            title="You haven't listed a space yet"
            action={
              <Link
                href="/listings/new"
                className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Create your first listing
              </Link>
            }
          >
            Add photos, set your share of the rent and pin your location so people can find you.
          </EmptyState>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const photos = l.listing_media.filter((m) => m.kind === "photo");
              const cover = photos.find((m) => m.category === "living_room") ?? photos[0];
              const coverUrl = cover
                ? supabase.storage.from("listing-media").getPublicUrl(cover.path).data.publicUrl
                : null;
              const status =
                l.status === "draft" ? (
                  <Pill tone="amber">Draft</Pill>
                ) : l.room_available ? (
                  daysSince(l.last_confirmed_at) >= STALE_DAYS ? (
  <Pill tone="amber">Needs confirming</Pill>
) : (
  <Pill tone="brand">Available</Pill>
)
                ) : (
                  <Pill>Hidden from feed</Pill>
                );

              return (
                <li key={l.id}>
                  <Link
                    href={`/listings/${l.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt="Your apartment"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-linear-to-br from-brand-50 to-brand-100 text-brand-300">
                          <HomeIcon className="h-10 w-10" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3">{status}</span>
                    </div>
                    <div className="p-5">
                      <p className="font-bold text-slate-900">
                        {typeLabels[l.apartment_type ?? "other"]}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPinIcon className="h-4 w-4 shrink-0 text-brand-600" />
                        <span className="truncate">{l.area}</span>
                      </p>
                      <p className="mt-3 text-lg font-extrabold text-slate-900">
                        ₦{l.contribution_amount?.toLocaleString("en-NG")}
                        <span className="ml-1 text-sm font-medium text-slate-500">/ year</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}