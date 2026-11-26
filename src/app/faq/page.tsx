import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ContactLinks from "@/components/ContactLinks";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about VerifiedRoomie: verification, Connect Points, safety, accounts and more.",
};

type QA = { q: string; a: string };
type Group = { icon: string; title: string; items: QA[] };

const groups: Group[] = [
  {
    icon: "👋",
    title: "Getting started",
    items: [
      {
        q: "What is VerifiedRoomie?",
        a: "VerifiedRoomie helps students, corps members, working professionals and other adults across all 36 Nigerian states and the FCT find compatible, verified housemates. You can either have a space and look for a housemate, or look for a space and a housemate.",
      },
      {
        q: "Is it free to join?",
        a: "Yes. Creating a profile and browsing are free. Every new account also starts with 5 Connect Points.",
      },
      {
        q: "How do I sign up?",
        a: "Tap Get started, fill in your details and confirm your email using the link we send you. Then add your photo and tell us whether you have an apartment or are looking for one.",
      },
      {
        q: "I didn't get the confirmation email. What should I do?",
        a: "Check your spam or junk folder first. The email comes from noreply@verifiedroomie.com. If it still isn't there after a few minutes, try registering again with the same email, or contact us using the details at the bottom of this page.",
      },
      {
        q: "What is the difference between “I have an apartment” and “I'm looking”?",
        a: "If you have an apartment, you post a listing and can browse people who are looking for a place. If you are looking, you browse listings, save the ones you like and send connection requests.",
      },
      {
        q: "Can I change my name or gender later?",
        a: "No. Your full name and gender are locked after you sign up, so other members can trust what they see. You can change your photo, bio and most other details from My profile.",
      },
    ],
  },
  {
    icon: "🛡️",
    title: "Verification",
    items: [
      {
        q: "What does “ID verified” mean?",
        a: "You uploaded a government ID and our team reviewed it. The badge only appears after our team approves it.",
      },
      {
        q: "What does “Apartment verified” mean?",
        a: "Our team reviewed the apartment's photos, video and location before the badge was added to the listing.",
      },
      {
        q: "How do I get my ID verified?",
        a: "Open the menu under your photo and choose Verify your ID, then upload a clear photo of your ID. If it is rejected, you'll get a notification and an email explaining that you can upload it again.",
      },
      {
        q: "Does a verified badge guarantee someone is safe?",
        a: "No. Badges mean our team checked documents. They help, but they don't replace your own checks. Please read our Safety tips before you meet anyone or pay anything.",
      },
      {
        q: "What kind of profile photo should I use?",
        a: "A clear photo of yourself, taken with your camera or picked from your gallery. Photos of houses, objects, documents or text (including phone numbers) aren't allowed. A photo that breaks the rules can be flagged and your profile may be suspended until you change it.",
      },
    ],
  },
  {
    icon: "🤝",
    title: "Connecting with people",
    items: [
      {
        q: "What are Connect Points?",
        a: "Connect Points are what you spend to send a connection request. Sending one request costs one Connect Point.",
      },
      {
        q: "How do I connect with someone?",
        a: "Open a listing or a profile and send a connection request. The other person gets a notification and an email, and can accept or decline.",
      },
      {
        q: "When do I see someone's phone number?",
        a: "Only after your request is accepted. The number then appears on your Requests page. We don't show phone numbers before that, and we don't put them in emails.",
      },
      {
        q: "What happens if my request is declined?",
        a: "You'll get a notification. If a Connect Point is returned to you, you'll get a notification for that too.",
      },
      {
        q: "How will I know when someone sends me a request?",
        a: "You'll see it under Requests, in the bell icon, and in an email with a link that takes you straight to the request.",
      },
      {
        q: "Can I say how many housemates I want?",
        a: "Yes. There is no separate setting for it. Owners can mention it in the apartment description or house rules, and seekers can say it in their bio.",
      },
    ],
  },
  {
    icon: "💳",
    title: "Connect Points and payments",
    items: [
      {
        q: "Do I have to pay to use VerifiedRoomie?",
        a: "Not right now. Payments are not active yet and no money can be charged. When they start, you will see the packages on the home page.",
      },
      {
        q: "Do Connect Points expire?",
        a: "No. Credits never expire.",
      },
      {
        q: "Will anyone ask me for money to contact them?",
        a: "VerifiedRoomie never asks you to send money to a member in order to “unlock” contact. If someone asks you for money before you have met them and seen the place, report them.",
      },
    ],
  },
  {
    icon: "🏠",
    title: "Listings (for owners)",
    items: [
      {
        q: "How do I post an apartment?",
        a: "Choose “I have an apartment” when you set up your profile, then add a listing with the yearly rent, area, move-in date, a short description, clear photos and an optional walkthrough video.",
      },
      {
        q: "Why isn't my apartment verified yet?",
        a: "Every listing is reviewed by our team before the badge appears. Make sure your photos are clear, taken at the apartment, and match the location you entered.",
      },
      {
        q: "Can I use photos from the internet or someone else's listing?",
        a: "No. Use your own photos of the actual apartment. Our system checks for photos and descriptions that are reused across different accounts, and listings that look copied may be reviewed and removed.",
      },
      {
        q: "How do I hide my listing once it is taken?",
        a: "Open the listing from your dashboard and use the controls to mark it as taken or to confirm availability.",
      },
    ],
  },
  {
    icon: "🔎",
    title: "Searching (for seekers)",
    items: [
      {
        q: "How do I search for a place?",
        a: "Choose a state first, then an area in that state, and the listings update. You can also use the filters to narrow your search.",
      },
      {
        q: "I found a place. Can I hide my profile?",
        a: "Yes. Once you have found somewhere, you can hide your profile so owners stop finding you. You can show it again whenever you like.",
      },
      {
        q: "Can I look for a place with a group of friends?",
        a: "Group apartment hunting is coming soon.",
      },
    ],
  },
  {
    icon: "🔐",
    title: "Account and privacy",
    items: [
      {
        q: "Who can see my phone number?",
        a: "Only a person whose connection request you have accepted (or whose request was accepted by you). It is never shown on your public profile.",
      },
      {
        q: "Can I use one phone number on two accounts?",
        a: "No. Each phone number can be used on only one account.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: "On the Login page, tap “Forgot your password?”, enter your email and follow the link we send you. After you set a new password, you'll be asked to log in again.",
      },
      {
        q: "Why was I logged out?",
        a: "To protect your account, we sign you out after a few minutes of inactivity, or if you leave the app for a while. Just log in again.",
      },
      {
        q: "How do I stop someone from contacting me?",
        a: "Use Block on their profile or listing. You can see and manage blocked people from Blocked users in the menu under your photo.",
      },
    ],
  },
  {
    icon: "🚩",
    title: "Safety and reporting",
    items: [
      {
        q: "How do I report a suspicious listing or person?",
        a: "Use the Report button at the bottom of any listing or profile. Our team reviews reports and can suspend accounts.",
      },
      {
        q: "Should I pay before I see the apartment?",
        a: "No. Never pay rent, a deposit, an inspection fee, an agent fee or a booking fee before you have seen the place in person and met the person face to face.",
      },
      {
        q: "Will VerifiedRoomie ever ask for my password, PIN or an OTP code?",
        a: "Never. Don't share them with anyone, including someone who says they work for VerifiedRoomie.",
      },
    ],
  },
];

export default async function FaqPage() {
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
        Frequently asked questions
      </h1>
      <p className="mt-2 text-slate-600">
        Quick answers about how VerifiedRoomie works. Can&apos;t find yours? Contact us at the bottom
        of this page.
      </p>

      <nav aria-label="Topics" className="mt-6 flex flex-wrap gap-2">
        {groups.map((g, i) => (
          <a
            key={g.title}
            href={`#topic-${i}`}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            <span aria-hidden="true">{g.icon}</span> {g.title}
          </a>
        ))}
      </nav>

      <div className="mt-8 grid gap-6">
        {groups.map((g, i) => (
          <section
            key={g.title}
            id={`topic-${i}`}
            className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <span aria-hidden="true">{g.icon}</span>
              {g.title}
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {g.items.map((item) => (
                <details key={item.q} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 text-xl leading-none text-brand-600 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-2 leading-relaxed text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg font-extrabold text-slate-900">Still need help?</p>
        <p className="mb-4 mt-1 text-slate-600">
          Read our{" "}
          <Link href="/safety" className="font-semibold text-brand-700">
            Safety tips
          </Link>
          , or reach us directly:
        </p>
        <ContactLinks />
      </div>
    </main>
  );
}