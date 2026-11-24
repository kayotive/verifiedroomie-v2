import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Safety tips",
  description:
    "How to stay safe when looking for a roommate or a room: avoid scams, meet safely and pay safely.",
};

const sections = [
  {
    icon: "🔎",
    title: "Before you connect",
    tips: [
      "Read the full profile or listing, and check that the bio, photos, area and price all make sense together.",
      "ID verified and Apartment verified badges mean our team reviewed documents. They help, but they don't replace your own checks.",
      "Be careful with rent that is far lower than similar places in the same area. If it sounds too good to be true, it usually is.",
      "Phone numbers are shared only after a request is accepted, so you can take your time getting to know a profile first.",
    ],
  },
  {
    icon: "🤝",
    title: "When you meet",
    tips: [
      "Meet in daylight, at the apartment or in a public place, for the first meeting.",
      "Tell a friend or family member where you're going, who you're meeting and when you'll be back. If you can, bring someone with you.",
      "Check that the person matches their profile photo, and that the apartment matches the listing photos and the area and landmarks described.",
      "If you are moving in, ask to meet the other people who live there and ask how bills and chores are shared.",
      "Trust your instincts. If you feel pressured or uncomfortable, leave.",
    ],
  },
  {
    icon: "💳",
    title: "Before you pay",
    tips: [
      "Never pay rent, a deposit, a \"caution fee\", an \"agent fee\", an \"inspection fee\" or a \"booking fee\" before you have seen the place in person and met the person.",
      "Do not pay anyone who says they are out of town or abroad and will send keys or a \"representative\" after you pay.",
      "Pay by bank transfer to an account whose name matches the owner or the clearly identified agent. Avoid cash where you can.",
      "Get a written receipt for every payment, and a signed tenancy or roommate agreement that states the amount, the period and the rules.",
      "Be wary of pressure like \"someone else is about to pay, send it now\". A genuine home will still be there tomorrow.",
      "Never share your password, card details, PIN, BVN or any OTP code with anyone, including someone who says they work for VerifiedRoomie.",
    ],
  },
  {
    icon: "🚩",
    title: "Red flags",
    tips: [
      "They ask for money before you have seen the place or met them.",
      "They refuse to meet, or only want to talk through messages, and push you to decide quickly.",
      "Their photos look like they came from a property website, or the details keep changing.",
      "They ask you to send money for any other reason, such as a loan, travel or an emergency.",
      "They send a screenshot of a payment, or ask you to refund an \"overpayment\".",
    ],
  },
  {
    icon: "🏠",
    title: "Extra tips for owners",
    tips: [
      "Check the seeker's profile and ID badge before you invite them to visit, and meet in daylight with someone else around.",
      "Do not hand over keys until the money is in your own bank account. Check your own banking app. Do not trust screenshots, SMS alerts or \"transfer successful\" screens, because fake transfer alerts are common.",
      "Never refund an \"overpayment\". This is a well-known scam.",
      "Ask to see a valid ID in person, and write down the rules and the payment terms in a short agreement.",
    ],
  },
  {
    icon: "🆘",
    title: "If something goes wrong",
    tips: [
      "Use the Report button at the bottom of any listing or profile. Our team reviews reports and can suspend accounts.",
      "Use Block to stop someone from contacting you.",
      "Stop sending money. Keep screenshots, receipts and messages, and report the matter to the police.",
      "If you have sent money to a scammer, contact your bank immediately. The sooner they know, the better.",
    ],
  },
];

export default async function SafetyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link href={user ? "/dashboard" : "/"} className="text-sm font-semibold text-brand-700">
        {user ? "← Back" : "← Home"}
      </Link>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Stay safe on VerifiedRoomie
      </h1>
      <p className="mt-2 text-slate-600">
        Most people here are genuine, but scammers exist everywhere. A few simple habits protect you
        and your money.
      </p>

      <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-lg font-extrabold text-amber-900">The golden rule</p>
        <p className="mt-1 text-amber-900">
          Never pay anyone anything before you have seen the place in person and met the person face
          to face.
        </p>
      </div>

      <div className="mt-8 grid gap-5">
        {sections.map((s) => (
          <section
            key={s.title}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <span aria-hidden="true">{s.icon}</span>
              {s.title}
            </h2>
            <ul className="mt-3 space-y-2 text-slate-700">
              {s.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden="true" className="mt-1 text-brand-600">
                    •
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-slate-500">
        These tips are general guidance, not legal advice. Connecting with someone through
        VerifiedRoomie does not guarantee that they are trustworthy, so always do your own checks.
      </p>
    </main>
  );
}