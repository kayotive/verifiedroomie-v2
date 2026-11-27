import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "../dashboard/LogoutButton";
import ContactLinks from "@/components/ContactLinks";

export default async function SuspendedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_suspended, suspended_reason")
    .eq("id", user.id)
    .single();

  // Not suspended (or reinstated): go back into the app
  if (!me?.is_suspended) redirect("/dashboard");

  // "photo" is a fixed code. Anything else is the message you typed for the person.
  const reason =
    me.suspended_reason === "photo"
      ? "Your profile photo did not follow our rules. It must be a clear photo of yourself, taken with your camera or picked from your gallery."
      : me.suspended_reason?.trim() ||
        "Our team is reviewing a report about your account.";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Account suspended</h1>

      <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Reason</p>
        <p className="mt-1 whitespace-pre-line text-sm text-amber-900">{reason}</p>
      </div>

      <p className="text-gray-600">
        If you think this is a mistake, or you have fixed the problem, send us an appeal. Use the
        email you signed up with and tell us your side. Our team will review it and reply by email.
      </p>

      <Link
        href="/contact?topic=appeal"
        className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Submit an appeal
      </Link>

      <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left">
        <ContactLinks showFormLink={false} />
      </div>

      <LogoutButton />
    </main>
  );
}