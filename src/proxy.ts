import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Record "last active" at most once every 10 minutes per person
const ACTIVE_REFRESH_MS = 10 * 60 * 1000;

// If the person has been away longer than this (same 3 minutes as the idle logout,
// plus 1 minute of safety for phone clocks), they are signed out when they come back.
const AWAY_MS = 3 * 60 * 1000 + 60 * 1000;
const LAST_ACTIVE_COOKIE = "vr_last_active";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user: foundUser },
  } = await supabase.auth.getUser();
  let user = foundUser;

  // Closed the browser without logging out? If they were away too long, sign them out now,
  // before any page is shown.
  if (user) {
    const cookieTime = Number(request.cookies.get(LAST_ACTIVE_COOKIE)?.value);
    const signedInAt = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
    const lastSeen = Math.max(Number.isFinite(cookieTime) ? cookieTime : 0, signedInAt);
    if (lastSeen > 0 && Date.now() - lastSeen > AWAY_MS) {
      await supabase.auth.signOut({ scope: "local" });
      response.cookies.set(LAST_ACTIVE_COOKIE, "", { path: "/", maxAge: 0 });
      user = null;
    }
  }

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path === "/login" ||
    path === "/register" ||
    path === "/forgot-password" ||
    path === "/safety" ||
    path.startsWith("/auth/");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    // keep the "signed out" cookie changes on the redirect too
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  if (user && !isPublic && path !== "/suspended") {
    const { data: me } = await supabase
      .from("profiles")
      .select("is_suspended, last_active_at")
      .eq("id", user.id)
      .single();

    // Suspended accounts can only see the /suspended page
    if (me?.is_suspended) {
      const url = request.nextUrl.clone();
      url.pathname = "/suspended";
      return NextResponse.redirect(url);
    }

    // Heartbeat: keep "last active" fresh without writing on every click
    const last = me?.last_active_at ? new Date(me.last_active_at).getTime() : 0;
    if (Date.now() - last > ACTIVE_REFRESH_MS) {
      await supabase.rpc("touch_last_active");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};