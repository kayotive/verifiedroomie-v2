"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="rounded-xl border border-emerald-600 px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
    >
      Log out
    </button>
  );
}