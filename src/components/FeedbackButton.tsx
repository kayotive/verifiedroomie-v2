"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const kinds = [
  { value: "idea", label: "💡 Idea" },
  { value: "problem", label: "🐞 Problem" },
  { value: "praise", label: "👍 Praise" },
];

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("idea");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Not shown on the password reset screen
  if (pathname === "/reset-password") return null;

  function close() {
    setOpen(false);
    if (sent) {
      setSent(false);
      setMessage("");
      setTopic("idea");
    }
    setError("");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "feedback", topic, message, page: pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not send. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Send feedback"
          className="fixed bottom-4 right-4 z-40 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-700"
        >
          💬 Feedback
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
          >
            {sent ? (
              <div className="text-center">
                <p className="text-xl font-extrabold text-slate-900">Thank you! ✅</p>
                <p className="mt-2 text-slate-600">Your feedback has been sent to our team.</p>
                <button
                  onClick={close}
                  className="mt-5 w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={send} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-extrabold text-slate-900">Send feedback</p>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="rounded-full p-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex gap-2">
                  {kinds.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setTopic(k.value)}
                      className={`flex-1 rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                        topic === k.value
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-slate-200 text-slate-700 hover:border-brand-300"
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={5}
                  minLength={10}
                  maxLength={2000}
                  placeholder="Tell us what you think, or what went wrong..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-brand-600 focus:outline-none"
                />

                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}