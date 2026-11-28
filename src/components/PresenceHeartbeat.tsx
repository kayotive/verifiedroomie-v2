"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const PING_EVERY_MS = 2 * 60 * 1000; // tell the server "still here" every 2 minutes
const ACTIVE_WITHIN_MS = 150 * 1000; // only if the person really used the page recently
const MIN_GAP_MS = 30 * 1000; // never ping more than once every 30 seconds
const KEY = "vr:lastActive"; // written by IdleLogout on every click, scroll or key press

export default function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient();
    let loggedIn = false;
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

    supabase.auth.getSession().then(({ data }) => {
      loggedIn = !!data.session;
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loggedIn = !!session;
    });

    const timer = window.setInterval(ping, PING_EVERY_MS);
    document.addEventListener("visibilitychange", ping);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}