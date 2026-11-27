import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ContactForm from "@/components/ContactForm";
import ContactLinks from "@/components/ContactLinks";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Send a message to the VerifiedRoomie team.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let defaultName = "";
  let defaultMessage = "";
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name, is_suspended, suspended_reason")
      .eq("id", user.id)
      .single();
    defaultName = p?.full_name ?? "";

    // Appeal: start the message with the reason they were given
    if (sp.topic === "appeal" && p?.is_suspended) {
      const why =
        p.suspended_reason === "photo"
          ? "my profile photo did not follow the rules"
          : p.suspended_reason?.trim() || "a report was being reviewed";
      defaultMessage = `I am appealing my suspension.\n\nReason I was given: ${why}\n\nMy side of the story:\n`;
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <Link href={user ? "/dashboard" : "/"} className="text-sm font-semibold text-brand-700">
        {user ? "← Back" : "← Home"}
      </Link>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Contact us
      </h1>
      <p className="mt-2 text-slate-600">
        Have a question or a problem? Send us a message. You may find a quick answer in our{" "}
        <Link href="/faq" className="font-semibold text-brand-700">
          FAQ
        </Link>{" "}
        first.
      </p>

      <div className="relative mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <ContactForm defaultName={defaultName} defaultEmail={user?.email ?? ""} defaultTopic={sp.topic} defaultMessage={defaultMessage} />
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="mb-3 text-sm text-slate-600">Prefer to reach us directly?</p>
        <ContactLinks showFormLink={false} />
      </div>
    </main>
  );
}