import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import {
  BriefcaseIcon,
  CameraIcon,
  CheckIcon,
  EyeIcon,
  FlagIcon,
  GraduationCapIcon,
  HomeIcon,
  InfoIcon,
  MapPinIcon,
  MedalIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/icons";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg active:translate-y-0";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-md active:translate-y-0";

const audiences = [
  {
    icon: GraduationCapIcon,
    title: "Students",
    body: "Share a flat near campus and split the cost with people who respect study time.",
  },
  {
    icon: MedalIcon,
    title: "Corps members",
    body: "Just got your posting? Find a safe shared space in a new state, fast.",
  },
  {
    icon: BriefcaseIcon,
    title: "Working professionals",
    body: "Live closer to work and save on rent with a housemate who fits your routine.",
  },
  {
    icon: UsersIcon,
    title: "Other adults",
    body: "Relocating, starting over or downsizing. Find people who share your values.",
  },
];

const steps = [
  {
    title: "Create your profile",
    body: "Share your details, your lifestyle and a short bio.",
  },
  {
    title: "Get verified",
    body: "Upload a government ID and, if you host, photos and a walkthrough video of your space.",
  },
  {
    title: "Discover matches",
    body: "Search by area and filter by gender, age, religion and smoking.",
  },
  {
    title: "Connect safely",
    body: "Spend a Connect Point to send a request. Phone numbers are shared only once it's accepted.",
  },
];

const safety = [
  {
    icon: ShieldCheckIcon,
    title: "Identity checks",
    body: "Members can submit a government ID for review by our team.",
  },
  {
    icon: CameraIcon,
    title: "Real apartment media",
    body: "Hosts upload photos, an optional walkthrough video and a map pin, so you know what to expect.",
  },
  {
    icon: EyeIcon,
    title: "Human review",
    body: "Our team reviews submissions before a verified badge appears on any profile or listing.",
  },
  {
    icon: FlagIcon,
    title: "Report and block",
    body: "Flag suspicious behaviour at any time. Safety comes before everything else.",
  },
];

const plans = [
  {
    name: "Starter",
    blurb: "For trying things out with a few strong matches.",
    price: "₦1,500",
    connections: "3 connections",
    popular: false,
  },
  {
    name: "Standard",
    blurb: "Best for most people actively searching this month.",
    price: "₦3,000",
    connections: "7 connections",
    popular: true,
  },
  {
    name: "Unlimited",
    blurb: "Connect with as many housemates as you need.",
    price: "₦5,000",
    connections: "Unlimited connections",
    popular: false,
  },
];

const planFeatures = [
  "Contact details shared once a request is accepted",
  "Access verified profiles",
  "Credits never expire",
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = !!user;

  // The main button changes depending on who is looking at the page
  let cta = { href: "/register", label: "Create your profile" };
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();
    if (!p?.user_type) {
      cta = { href: "/onboarding", label: "Finish setting up your profile" };
    } else if (p.user_type === "owner") {
      cta = { href: "/dashboard", label: "Open your dashboard" };
    } else {
      cta = { href: "/feed", label: "Browse listings" };
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-linear-to-b from-brand-50 via-brand-50/60 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-2">
          <div className="vr-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
              <MapPinIcon className="h-4 w-4 text-brand-600" />
              All 36 states + the FCT
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Find a housemate you can{" "}
              <span className="text-brand-600">actually trust</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              VerifiedRoomie helps students, corps members, working professionals
              and other adults across Nigeria meet compatible housemates, share
              rent fairly, and move in with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={cta.href} className={btnPrimary}>
                {cta.label}
              </Link>
              <Link href="#how-it-works" className={btnSecondary}>
                See how it works
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <li className="inline-flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-brand-600" /> ID-verified profiles
              </li>
              <li className="inline-flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-brand-600" /> Reviewed apartment photos
              </li>
            </ul>
          </div>

          <div className="vr-rise vr-rise-2 relative">
            <Image
              src="/images/hero-housemates.jpg"
              alt="Three young adults relaxing together in a bright shared living room"
              width={1408}
              height={768}
              priority
              className="w-full rounded-3xl object-cover shadow-card ring-1 ring-slate-900/5"
            />
            <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <ShieldCheckIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">Verification first</p>
                <p className="text-sm text-slate-500">Every profile can be reviewed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Built for every stage of Nigerian life
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            From Sokoto to Calabar, from Lagos to Maiduguri. Wherever life takes you.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {audiences.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-sm font-semibold text-brand-600">Three ways to match</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Tell us where you are. We&apos;ll show you who fits.
          </h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
                <HomeIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                I have an apartment and need a housemate to share rent.
              </h3>
              <p className="mt-2 leading-relaxed text-slate-600">
                List your space, set your share of the rent, and meet people who fit your home.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
                <SearchIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                I don&apos;t have an apartment and need a housemate who has one.
              </h3>
              <p className="mt-2 leading-relaxed text-slate-600">
                Browse verified spaces and connect with hosts looking for someone like you.
              </p>
            </div>
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                  <UsersIcon className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Coming soon
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-700">
                I want to find other people to rent an apartment together.
              </h3>
              <p className="mt-2 leading-relaxed text-slate-500">
                Team up with compatible people and search for a new place as a group.
              </p>
            </div>
          </div>

          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-extrabold text-brand-700">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <Link href={cta.href} className={btnPrimary}>
              {loggedIn ? cta.label : "Start with your housing status"}
            </Link>
          </div>
        </div>
      </section>

      {/* Verification */}
      <section id="verification" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative row-span-2 min-h-[22rem] overflow-hidden rounded-3xl bg-slate-100">
                <Image
                  src="/images/apt-bedroom.jpg"
                  alt="Clean bedroom with a double bed and curtains"
                  fill
                  sizes="(min-width: 1024px) 25vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100">
                <Image
                  src="/images/apt-kitchen.jpg"
                  alt="Compact modern kitchen"
                  fill
                  sizes="(min-width: 1024px) 25vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-end rounded-3xl bg-brand-600 p-6 text-white">
                <p className="text-3xl font-extrabold sm:text-4xl">36 + FCT</p>
                <p className="mt-1 text-sm text-brand-100">covered from day one</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Illustrative photos.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-brand-600">Safety by design</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Verified people. Verified spaces.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Sharing a home is a big decision. VerifiedRoomie is designed around checks
              that help you feel confident before you ever meet in person.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {safety.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-600">Connection credits</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Simple, one-time packages
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              Creating a profile and browsing is free. Every new account starts with 5 free
              Connect Points, and you only spend one when you want to connect.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            <InfoIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <p>These are proposed packages. Payments are not active yet and no money can be charged.</p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-3xl bg-white p-7 ${
                  p.popular
                    ? "border-2 border-brand-600 shadow-card"
                    : "border border-slate-200 shadow-sm"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-7 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Proposed
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{p.blurb}</p>
                <p className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900">{p.price}</p>
                <p className="mt-1 font-semibold text-brand-600">{p.connections}</p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled
                  className="mt-6 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-400"
                >
                  Coming soon
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="px-5 py-20 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-600 p-10 md:p-14">
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div aria-hidden="true" className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative max-w-xl">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Your next home starts with the right person.
            </h2>
            <p className="mt-3 text-lg text-brand-100">Set up your profile in a few minutes.</p>
            <Link
              href={cta.href}
              className="mt-7 inline-flex rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {loggedIn ? cta.label : "Get started free"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-slate-500">Housemate matching across Nigeria.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600" aria-label="Footer">
            <Link href="#how-it-works" className="hover:text-brand-700">How it works</Link>
            <Link href="#verification" className="hover:text-brand-700">Verification</Link>
            <Link href="#pricing" className="hover:text-brand-700">Pricing</Link>
            {!loggedIn && <Link href="/login" className="hover:text-brand-700">Log in</Link>}
            {!loggedIn && <Link href="/register" className="hover:text-brand-700">Create account</Link>}
          </nav>
        </div>
        <p className="border-t border-slate-100 px-5 py-5 text-center text-xs text-slate-500">
          © 2026 VerifiedRoomie. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
