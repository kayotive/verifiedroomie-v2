"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Logo from "./Logo";
import { ChevronDownIcon, MenuIcon, XIcon } from "./icons";

export type Viewer = {
  name: string;
  avatarUrl: string | null;
  role: string | null;
  isAdmin: boolean;
  idVerified: boolean;
  isSuspended: boolean;
  pendingRequests: number;
  unreadNotifications: number;
};

type NavLink = { href: string; label: string; badge?: number };

const itemClass =
  "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700";

export default function HeaderClient({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const close = () => {
    setMenuOpen(false);
    setUserOpen(false);
  };

  async function logout() {
    await createClient().auth.signOut();
    close();
    router.push("/");
    router.refresh();
  }

  // Signed in but cannot use the full menu yet: suspended, or has not finished first-time setup
  const limited = !!viewer && (viewer.isSuspended || !viewer.role);
  const needsSetup = !!viewer && !viewer.isSuspended && !viewer.role;

  let links: NavLink[] = [];
  if (!viewer) {
    links = [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#verification", label: "Verification" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/safety", label: "Safety tips" },
      { href: "/faq", label: "FAQ" },
    ];
  } else if (!limited && viewer.role === "owner") {
    links = [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/people", label: "People" },
      { href: "/requests", label: "Requests", badge: viewer.pendingRequests },
      { href: "/safety", label: "Safety tips" },
    ];
  } else if (!limited) {
    links = [
      { href: "/feed", label: "Listings" },
      { href: "/saved", label: "Saved" },
      { href: "/requests", label: "Requests", badge: viewer.pendingRequests },
      { href: "/safety", label: "Safety tips" },
    ];
  }

  const isActive = (href: string) =>
    !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  const homeHref = !viewer || limited ? "/" : viewer.role === "owner" ? "/dashboard" : "/feed";

  const navLinkClass = (href: string) =>
    `inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive(href)
        ? "bg-brand-50 text-brand-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const badge = (n?: number) =>
    n ? (
      <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
        {n}
      </span>
    ) : null;

  const initial = (viewer?.name || "?").trim().charAt(0).toUpperCase();

  // The password reset page is a clean standalone screen: no menus, no avatar
  if (pathname === "/reset-password") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo href={homeHref} onClick={close} />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={navLinkClass(l.href)}>
              {l.label}
              {badge(l.badge)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!viewer && (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md"
              >
                Get started
              </Link>
            </div>
          )}

          {viewer && limited && (
            <div className="flex items-center gap-2">
              {needsSetup && (
                <Link
                  href="/onboarding"
                  onClick={close}
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md"
                >
                  Finish setup
                </Link>
              )}
              <button
                onClick={logout}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Log out
              </button>
            </div>
          )}

          {viewer && !limited && (
     <Link
       href="/notifications"
       onClick={close}
       aria-label={
         viewer.unreadNotifications
           ? `Notifications, ${viewer.unreadNotifications} unread`
           : "Notifications"
       }
       className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
     >
       <svg
         viewBox="0 0 24 24"
         className="h-6 w-6"
         fill="none"
         stroke="currentColor"
         strokeWidth="2"
         strokeLinecap="round"
         strokeLinejoin="round"
         aria-hidden="true"
       >
         <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
         <path d="M13.73 21a2 2 0 0 1-3.46 0" />
       </svg>
       {viewer.unreadNotifications > 0 && (
         <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold leading-none text-white">
           {viewer.unreadNotifications > 9 ? "9+" : viewer.unreadNotifications}
         </span>
       )}
     </Link>
   )}
   {viewer && !limited && (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userOpen}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 transition hover:border-brand-300 hover:shadow-sm"
              >
                {viewer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewer.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {initial}
                  </span>
                )}
                <ChevronDownIcon
                  className={`h-4 w-4 text-slate-500 transition-transform ${
                    userOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                >
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {viewer.name || "Your account"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {viewer.role === "owner" ? "Apartment owner" : "Looking for a room"}
                    </p>
                  </div>
                  <div className="py-1.5">
                    <Link href="/profile" onClick={close} className={itemClass}>
                      My profile
                    </Link>
                    {!viewer.idVerified && (
                      <Link href="/verify" onClick={close} className={itemClass}>
                        Verify your ID
                      </Link>
                    )}
                    <Link href="/blocked" onClick={close} className={itemClass}>
                      Blocked users
                    </Link>
                    <Link href="/reset-password" onClick={close} className={itemClass}>
                      Change password
                    </Link>
                    <Link href="/faq" onClick={close} className={itemClass}>
                      Help &amp; FAQ
                    </Link>
                    {viewer.isAdmin && (
                      <>
                        <div className="mx-3 my-1.5 border-t border-slate-100" />
                        <Link href="/admin/verifications" onClick={close} className={itemClass}>
                          Admin: verifications
                        </Link>
                        <Link href="/admin/reports" onClick={close} className={itemClass}>
                          Admin: reports
                        </Link>
                        <Link href="/admin/photos" onClick={close} className={itemClass}>
                          Admin: photos
                        </Link>
                      </>
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-1.5">
                    <button onClick={logout} className={itemClass}>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!limited && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
            >
              {menuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>

      {menuOpen && !limited && (
        <div className="border-t border-slate-100 bg-white px-5 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className={`${navLinkClass(l.href)} py-3 text-base`}
              >
                {l.label}
                {badge(l.badge)}
              </Link>
            ))}
          </nav>
          {!viewer && (
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={close}
                className="rounded-xl border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="rounded-xl bg-brand-600 px-4 py-3 text-center font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}