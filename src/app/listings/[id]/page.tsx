import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarZoom from "@/components/AvatarZoom";
import PhotoVerifiedBadge from "@/components/PhotoVerifiedBadge";
import { whatsappLink } from "@/lib/phone";
import ConnectButton from "./ConnectButton";
 import HiddenProfileConnect from "./HiddenProfileConnect";
 import SaveButton from "@/components/SaveButton";
import OwnerListingControls from "./OwnerListingControls";
import ReportBlock from "@/components/ReportBlock";
import { ActivityBadge, timeAgo } from "@/components/ui";
import PhotoGallery from "./PhotoGallery";

const typeLabels: Record<string, string> = {
  self_contained: "Self-contained",
  "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom",
  "3_bedroom": "3 Bedroom",
  other: "Other",
};
const genderLabels: Record<string, string> = { male: "Male", female: "Female", other: "Other" };
const occupationLabels: Record<string, string> = {
  student: "Student",
  nysc_corper: "NYSC Corper",
  professional: "Professional",
  other: "Other",
};
const smokingLabels: Record<string, string> = { non_smoker: "Non-smoker", smoker: "Smoker" };
const prefLabels: Record<string, string> = { male: "Male roomie", female: "Female roomie", any: "Any gender" };
const categoryLabels: Record<string, string> = {
  living_room: "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  balcony: "Balcony",
  compound: "Compound",
  parking: "Parking",
};
const photoOrder = Object.keys(categoryLabels);

type Media = { path: string; category: string | null; kind: string };
type Detail = {
  id: string;
  owner_id: string;
  room_available: boolean;
  apartment_type: string | null;
  contribution_amount: number | null;
  move_in_date: string | null;
  hidden_reason: string | null;
last_confirmed_at: string;
  last_active_at: string | null;
  description: string | null;
  house_rules: string | null;
  place_name: string | null;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  apartment_verified: boolean;
  profiles: {
    full_name: string;
    gender: string | null;
    birth_year: number | null;
    occupation: string | null;
    religion: string | null;
    smoking: string | null;
    avatar_url: string | null;
    bio: string | null;
    roomie_gender_preference: string | null;
    id_verified: boolean;
    phone_verified: boolean;
    photo_status: string;
    is_suspended: boolean;
  };
  listing_media: Media[];
};

export default async function ListingDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // One friendly screen for every case where the listing can't be shown
  // (removed by the owner, hidden, taken, or not available right now)
  const unavailable = (
    <main className="mx-auto max-w-md px-4 py-10 text-center">
      <p className="text-4xl" aria-hidden="true">🔒</p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">This listing isn&apos;t available right now</h1>
      <p className="mt-2 text-gray-600">
        It may have been removed, taken, or is not available at the moment. Saved listings that are still
        available stay in your Saved tab.
      </p>
      <Link
        href="/feed"
        className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
      >
        Browse listings
      </Link>
    </main>
  );

  const { data } = await supabase
    .from("listings")
    .select(
      `id, owner_id, room_available, apartment_type, contribution_amount, hidden_reason, last_confirmed_at, last_active_at, move_in_date, description,
       house_rules, place_name, area, latitude, longitude, apartment_verified,
       profiles!inner(full_name, gender, birth_year, occupation, religion, smoking, avatar_url, bio, roomie_gender_preference, id_verified, phone_verified, photo_status, is_suspended),
       listing_media(path, category, kind)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return unavailable;
  const l = data as unknown as Detail;
  const p = l.profiles;

  const { data: myProfile } = await supabase
    .from("profiles")
     .select("user_type, connect_points, is_paused, paused_reason, is_admin")
    .eq("id", user.id)
    .single();

  const isMine = l.owner_id === user.id;
  const notConfirmedForTooLong =
     new Date(l.last_confirmed_at).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000;
   // A suspended owner's listing is hidden from everyone except admins
   const hiddenBySuspension = !isMine && p.is_suspended && !myProfile?.is_admin;
   if (hiddenBySuspension || (!isMine && (!l.room_available || notConfirmedForTooLong))) {
     return unavailable;
   }
  const { data: savedRow } = await supabase
     .from("saved_listings")
     .select("id")
     .eq("user_id", user.id)
     .eq("listing_id", l.id)
     .maybeSingle();

  let connection: { status: string; requester_id: string } | null = null;
  let phone: string | null = null;

  if (!isMine) {
    const { data: conn } = await supabase
      .from("connections")
      .select("status, requester_id")
      .eq("listing_id", l.id)
      .or(
        `and(requester_id.eq.${user.id},receiver_id.eq.${l.owner_id}),and(requester_id.eq.${l.owner_id},receiver_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();
    connection = conn;

    if (connection?.status === "accepted") {
      const { data: num } = await supabase.rpc("get_contact_phone", { p_user: l.owner_id });
      phone = (num as string | null) ?? null;
    }
  }

  const url = (path: string) =>
    supabase.storage.from("listing-media").getPublicUrl(path).data.publicUrl;

  const photos = l.listing_media
    .filter((m) => m.kind === "photo")
    .sort((a, b) => photoOrder.indexOf(a.category ?? "") - photoOrder.indexOf(b.category ?? ""));
  const video = l.listing_media.find((m) => m.kind === "video");

  const age = p.birth_year ? new Date().getFullYear() - p.birth_year : null;
  const firstName = p.full_name.split(" ")[0];
  const badges = ["📧 Email verified"];
  if (p.phone_verified) badges.push("📱 Phone verified");
  if (p.id_verified) badges.push("🪪 ID verified");
  if (l.apartment_verified) badges.push("🏠 Apartment verified");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      {from === "verifications" ? (
        <Link href="/admin/verifications" className="text-sm font-semibold text-emerald-700">
          ← Back to verifications
        </Link>
      ) : from === "duplicates" ? (
        <Link
          href="/admin/duplicates"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          ✕ Close
        </Link>
      ) : (
        <Link href={isMine ? "/dashboard" : "/feed"} className="text-sm font-semibold text-emerald-700">
          ← Back
        </Link>
      )}

      <p className="mt-3 text-2xl font-bold text-gray-900">
        ₦{l.contribution_amount?.toLocaleString("en-NG")}{" "}
        <span className="text-base font-normal text-gray-500">per year</span>
      </p>
      <p className="text-gray-800">
        {typeLabels[l.apartment_type ?? "other"]} · 📍 {l.area}
      </p>
      {l.move_in_date && (
        <p className="text-sm text-gray-600">
          Move-in:{" "}
          {new Date(l.move_in_date).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      <p className="mt-2 text-xs text-gray-500">
  ✅ Availability confirmed {timeAgo(l.last_confirmed_at)}
</p>
{!isMine && myProfile?.user_type === "seeker" && connection?.status !== "accepted" && (
     <div className="mt-3">
       <SaveButton listingId={l.id} userId={user.id} initialSaved={!!savedRow} showLabel />
     </div>
   )}
<PhotoGallery
  photos={photos.map((m) => ({
    src: url(m.path),
    label: categoryLabels[m.category ?? ""] ?? "Photo",
  }))}
/>

      {video && (
        <div className="mt-4">
          <h2 className="mb-1 font-semibold text-gray-900">Walkthrough video</h2>
          <video controls preload="metadata" src={url(video.path)} className="w-full rounded-xl" />
        </div>
      )}

      <section className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-200 p-3">
        <div className="flex flex-col items-center gap-1.5">
          {p.avatar_url && (
            <AvatarZoom src={p.avatar_url} name={p.full_name} size={64} />
          )}
          <PhotoVerifiedBadge show={p.photo_status === "approved"} />
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {firstName}
            {age ? `, ${age}` : ""}
            {p.gender ? ` · ${genderLabels[p.gender]}` : ""}
          </p>
          <p className="text-sm text-gray-600">
            {p.occupation ? occupationLabels[p.occupation] : ""}
            {p.religion ? ` · ${p.religion}` : ""}
            {p.smoking ? ` · ${smokingLabels[p.smoking]}` : ""}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-800">
  🏠 Looking for: {prefLabels[p.roomie_gender_preference ?? "any"]}
</p>
{!isMine && (
  <p className="mt-1">
    <ActivityBadge iso={l.last_active_at} className="text-xs text-gray-600" />
  </p>
)}
<div className="mt-1 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span key={b} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {p.bio && (
  <section className="mt-5">
    <h2 className="mb-1 font-semibold text-gray-900">About {firstName}</h2>
    <p className="whitespace-pre-line text-gray-700">{p.bio}</p>
  </section>
)}
{l.description && (
        <section className="mt-5">
          <h2 className="mb-1 font-semibold text-gray-900">About the apartment</h2>
          <p className="whitespace-pre-line text-gray-700">{l.description}</p>
        </section>
      )}

      {l.house_rules && (
        <section className="mt-5">
          <h2 className="mb-1 font-semibold text-gray-900">House rules</h2>
          <p className="whitespace-pre-line text-gray-700">{l.house_rules}</p>
        </section>
      )}

      
      {!isMine && (
  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    <p className="font-semibold">🛡️ Stay safe</p>
    <p className="mt-1">
      Never pay anyone before you&apos;ve seen the place and met the person. Meet in daylight and tell someone where you&apos;re going.{" "}
      <Link href="/safety" className="font-semibold underline">
        Read the safety tips
      </Link>
    </p>
  </div>
)}
<section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        {isMine ? (
          <OwnerListingControls listingId={l.id} roomAvailable={l.room_available} hiddenReason={l.hidden_reason} lastConfirmedAt={l.last_confirmed_at} />
        ) : myProfile?.user_type !== "seeker" ? (
          <p className="text-center text-gray-700">
            Only people looking for an apartment can connect with a listing.
          </p>
        ) : !connection ? (
          myProfile?.is_paused ? (
     <HiddenProfileConnect reason={myProfile?.paused_reason ?? null} />
   ) : (
   <ConnectButton
            receiverId={l.owner_id}
            listingId={l.id}
            points={myProfile?.connect_points ?? 0}
          />
          )
        ) : connection.status === "pending" ? (
          connection.requester_id === user.id ? (
            <p className="text-center text-gray-700">
              ✅ Request sent. We&apos;ll show their phone number here once they accept.
            </p>
          ) : (
            <p className="text-center text-gray-700">
              This person sent you a request.{" "}
              <Link href="/requests" className="font-semibold text-emerald-700">
                View requests
              </Link>
            </p>
          )
        ) : connection.status === "accepted" ? (
          <div className="text-center">
            <p className="font-semibold text-gray-900">🎉 You&apos;re connected!</p>
            {phone ? (
              <>
                <p className="mt-1 text-lg text-gray-800">{phone}</p>
                <div className="mt-2 flex justify-center gap-3">
                  <a href={`tel:${phone}`} className="font-semibold text-emerald-700">Call</a>
                  <a href={whatsappLink(phone)} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700">
                    WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">No phone number on file.</p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-700">This request was declined.</p>
        )}
      </section>
      {!isMine && (
        <ReportBlock userId={l.owner_id} listingId={l.id} isListing afterBlockHref="/feed" />
      )}
    </main>
  );
}