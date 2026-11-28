"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const PING_EVERY_MS = 60 * 1000; // tell the server "still here" every minute
const ACTIVE_WITHIN_MS = 90 * 1000; // only if the person really used the page in the last 90 seconds
const MIN_GAP_MS = 20 * 1000; // never ping more than once every 20 seconds
const KEY = "vr:lastActive"; // written by IdleLogout on every click, scroll or key press

export default function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient();
    let loggedIn = false;
    let token: string | null = null;
    let lastPing = 0;

    function recentlyActive() {
      try {
        const v = Number(localStorage.getItem(KEY));
        return Number.isFinite(v) && v > 0 && Date.now() - v < ACTIVE_WITHIN_MS;
      } catch {
        return true;
      }
    }

    async function ping() {
      if (!loggedIn) return;
      if (document.visibilityState !== "visible") return;
      if (!recentlyActive()) return;
      if (Date.now() - lastPing < MIN_GAP_MS) return;
      lastPing = Date.now();
      try {
        await supabase.rpc("touch_last_active");
      } catch {
        // ignore, we will try again next time
      }
    }

    // Tab or browser closed: show as offline straight away.
    // (A refresh also triggers this, but the new page pings again within seconds.)
    function leave() {
      if (!loggedIn || !token) return;
      try {
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/go_offline`, {
          method: "POST",
          keepalive: true,
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: "{}",
        });
      } catch {
        // ignore
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      loggedIn = !!data.session;
      token = data.session?.access_token ?? null;
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loggedIn = !!session;
      token = session?.access_token ?? null;
    });

    const first = window.setTimeout(ping, 1500); // right after a page opens or refreshes
    const timer = window.setInterval(ping, PING_EVERY_MS);
    document.addEventListener("visibilitychange", ping);
    window.addEventListener("pagehide", leave);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
      window.removeEventListener("pagehide", leave);
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}