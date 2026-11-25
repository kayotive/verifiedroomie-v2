"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const IDLE_MS = 3 * 60 * 1000; // log out after 3 minutes of no activity
const WARN_MS = 30 * 1000; // show a warning for the last 30 seconds
const KEY = "vr:lastActive";

function readLast(fallback: number) {
  try {
    const v = localStorage.getItem(KEY);
    return v ? Number(v) : fallback;
  } catch {
    return fallback;
  }
}

// The server cannot read localStorage, so the same time is also kept in a cookie.
// The server checks it when the person comes back, even after the browser was closed.
const COOKIE = "vr_last_active";

function setCookie(t: number | null) {
  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie =
      t === null
        ? `${COOKIE}=; path=/; max-age=0; samesite=lax${secure}`
        : `${COOKIE}=${t}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secure}`;
  } catch {
    // ignore if cookies are blocked
  }
}

function writeLast(t: number) {
  try {
    localStorage.setItem(KEY, String(t));
  } catch {
    // ignore if storage is blocked
  }
  setCookie(t);
}

export default function IdleLogout() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const warningRef = useRef(false);
  const lastRef = useRef(Date.now());

  // Know whether someone is logged in, and react to login / logout
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Watch for inactivity while logged in
  useEffect(() => {
    if (!loggedIn) {
      warningRef.current = false;
      setSecondsLeft(null);
      return;
    }

    const supabase = createClient();
    let done = false;

    const start = Date.now();
    lastRef.current = start;
    writeLast(start);

    const markActive = () => {
      if (warningRef.current) return; // during the warning, only the button counts
      const t = Date.now();
      if (t - lastRef.current < 1000) return; // limit how often we record
      lastRef.current = t;
      writeLast(t);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "wheel",
      "click",
      "touchstart",
      "touchmove",
    ];
    events.forEach((e) =>
      window.addEventListener(e, markActive, { passive: true, capture: true })
    );

    const logout = async () => {
      if (done) return;
      done = true;
      try {
        await supabase.auth.signOut();
      } catch {
        // go to login anyway
      }
      try {
        localStorage.removeItem(KEY);
      } catch {
        // ignore
      }
      setCookie(null);
      window.location.assign("/login");
    };

    const check = () => {
      if (done) return;
      // Also counts activity from other open tabs of the site
      const last = Math.max(lastRef.current, readLast(lastRef.current));
      lastRef.current = last;
      const idle = Date.now() - last;

      if (idle >= IDLE_MS) {
        logout();
      } else if (idle >= IDLE_MS - WARN_MS) {
        warningRef.current = true;
        setSecondsLeft(Math.ceil((IDLE_MS - idle) / 1000));
      } else {
        warningRef.current = false;
        setSecondsLeft(null);
      }
    };

    const timer = window.setInterval(check, 1000);
    // Phones pause timers when locked, so re-check as soon as the user returns
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);

    return () => {
      done = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      events.forEach((e) =>
        window.removeEventListener(e, markActive, { capture: true })
      );
    };
  }, [loggedIn]);

  function stayLoggedIn() {
    const t = Date.now();
    lastRef.current = t;
    writeLast(t);
    warningRef.current = false;
    setSecondsLeft(null);
  }

  if (!loggedIn || secondsLeft === null) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Inactivity warning"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">Are you still there?</h2>
        <p className="mt-2 text-sm text-slate-600">
          For your security, you&apos;ll be logged out in{" "}
          <span className="font-semibold text-slate-900">{secondsLeft}s</span>{" "}
          because there has been no activity.
        </p>
        <button
          type="button"
          onClick={stayLoggedIn}
          className="mt-5 w-full rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
        >
          Stay logged in
        </button>
      </div>
    </div>
  );
}