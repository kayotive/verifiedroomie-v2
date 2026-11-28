import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Marks the person as offline right now (used when they log out).
 * Never throws: logging out must always work, even if this fails.
 */
export async function goOffline(supabase: SupabaseClient) {
  try {
    await supabase.rpc("go_offline");
  } catch {
    // ignore
  }
}