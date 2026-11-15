"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccount({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAdmin) {
    return (
      <p className="text-center text-xs text-gray-500">
        Admin accounts can&apos;t be deleted from here.
      </p>
    );
  }

  async function handleDelete() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // 1. Find every file that belongs to this account
    const { data: myListings } = await supabase
      .from("listings")
      .select("id")
      .eq("owner_id", user.id);
    const listingIds = (myListings ?? []).map((l) => l.id);

    let mediaPaths: string[] = [];
    if (listingIds.length > 0) {
      const { data: media } = await supabase
        .from("listing_media")
        .select("path")
        .in("listing_id", listingIds);
      mediaPaths = (media ?? []).map((m) => m.path);
    }

    const { data: docs } = await supabase
      .from("id_verifications")
      .select("document_path")
      .eq("user_id", user.id);
    const docPaths = (docs ?? []).map((d) => d.document_path);

    // 2. Delete the files
    if (mediaPaths.length > 0) {
      const { error } = await supabase.storage.from("listing-media").remove(mediaPaths);
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
    }
    if (docPaths.length > 0) {
      const { error } = await supabase.storage.from("id-documents").remove(docPaths);
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
    }
    await supabase.storage.from("avatars").remove([`${user.id}/avatar`]);

    // 3. Delete the account itself
    const { error: deleteError } = await supabase.rpc("delete_my_account");
    if (deleteError) {
      setLoading(false);
      setError(deleteError.message);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-red-200 p-4">
      <h2 className="font-semibold text-red-700">Delete my account</h2>
      {!open ? (
        <>
          <p className="mt-1 text-sm text-gray-600">
            Permanently delete your profile, listings, photos, connections and any ID
            document you uploaded.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            I want to delete my account
          </button>
        </>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm text-red-800">
            This cannot be undone. Everything linked to your account will be erased. Type{" "}
            <strong>DELETE</strong> to confirm.
          </p>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-xl border border-red-300 px-3 py-2 focus:border-red-600 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading || text !== "DELETE"}
              className="flex-1 rounded-xl bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete my account"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setText("");
              }}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}