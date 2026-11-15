import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "../dashboard/LogoutButton";

export default async function SuspendedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("id", user.id)
    .single();

  // Not suspended (or reinstated): go back into the app
  if (!me?.is_suspended) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Account suspended</h1>
      <p className="text-gray-600">
        Your account has been suspended while our team reviews a report. If you think this
        is a mistake, please contact support.
      </p>
      <LogoutButton />
    </main>
  );
}