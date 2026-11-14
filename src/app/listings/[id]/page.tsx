import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whatsappLink } from "@/lib/phone";
import ConnectButton from "./ConnectButton";
import ListingMap from "./ListingMap";

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
  apartment_type: string | null;
  contribution_amount: number | null;
  move_in_date: string | null;
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
    id_verified: boolean;
    phone_verified: boolean;
  };
  listing_media: Media[];
};

export default async function ListingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("listings")
    .select(
      `id, owner_id, apartment_type, contribution_amount, move_in_date, description,
       house_rules, place_name, area, latitude, longitude, apartment_verified,
       profiles!inner(full_name, gender, birth_year, occupation, religion, smoking, avatar_url, id_verified, phone_verified),
       listing_media(path, category, kind)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const l = data as unknown as Detail;
  const p = l.profiles;

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("user_type, connect_points")
    .eq("id", user.id)
    .single();

  const isMine = l.owner_id === user.id;

  let connection: { status: string; requester_id: string } | null = null;
  let phone: string | null = null;

  if (!isMine) {
    const { data: conn } = await supabase
      .from("connections")
      .select("status, requester_id")
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
      <Link href={isMine ? "/dashboard" : "/feed"} className="text-sm font-semibold text-emerald-700">
        ← Back
      </Link>

      <p className="mt-3 text-2xl font-bold text-gray-900">
        ₦{l.contribution_amount?.toLocaleString("en-NG")}{" "}
        <span className="text-base font-normal text-gray-500">per year</span>
      </p>
      <p className="text-gray-800">
        {typeLabels[l.apartment_type ?? "other"]} · 📍 {l.place_name}, {l.area}
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

      <div className="mt-4 grid grid-cols-2 gap-2">
        {photos.map((m) => (
          <figure key={m.path} className="overflow-hidden rounded-xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url(m.path)} alt={categoryLabels[m.category ?? ""] ?? "Photo"} className="h-36 w-full object-cover" />
            <figcaption className="px-2 py-1 text-xs text-gray-600">
              {categoryLabels[m.category ?? ""] ?? "Photo"}
            </figcaption>
          </figure>
        ))}
      </div>

      {video && (
        <div className="mt-4">
          <h2 className="mb-1 font-semibold text-gray-900">Walkthrough video</h2>
          <video controls preload="metadata" src={url(video.path)} className="w-full rounded-xl" />
        </div>
      )}

      <section className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-200 p-3">
        {p.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatar_url} alt={firstName} className="h-16 w-16 rounded-full object-cover" />
        )}
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
          <div className="mt-1 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span key={b} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

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

      {l.latitude !== null && l.longitude !== null && (
        <section className="mt-5">
          <h2 className="mb-2 font-semibold text-gray-900">Location</h2>
          <ListingMap lat={l.latitude} lng={l.longitude} />
          <a
            href={`https://www.google.com/maps?q=${l.latitude},${l.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-emerald-700"
          >
            Open in Google Maps →
          </a>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        {isMine ? (
          <p className="text-center text-gray-700">This is your listing.</p>
        ) : myProfile?.user_type !== "seeker" ? (
          <p className="text-center text-gray-700">
            Only people looking for an apartment can connect with a listing.
          </p>
        ) : !connection ? (
          <ConnectButton
            receiverId={l.owner_id}
            listingId={l.id}
            points={myProfile?.connect_points ?? 0}
          />
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
    </main>
  );
}