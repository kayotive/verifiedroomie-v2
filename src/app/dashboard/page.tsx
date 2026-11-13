import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile?.user_type) redirect("/onboarding");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {profile.avatar_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt="Your profile photo"
          className="h-28 w-28 rounded-full object-cover"
        />
      )}
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome, {profile.full_name || "friend"}!
      </h1>
      <p className="max-w-sm text-gray-600">
        {profile.user_type === "owner"
          ? "You have an apartment. Creating your listing is the next thing we'll build."
          : "You're looking for an apartment or roommate. The home feed is coming soon."}
      </p>
      <LogoutButton />
    </main>
  );
}