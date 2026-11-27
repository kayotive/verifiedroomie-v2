"use client";

import { useState } from "react";

const topics = [
  { value: "account", label: "Account" },
  { value: "verification", label: "Verification" },
  { value: "appeal", label: "Appeal a suspension" },
  { value: "report", label: "Report a problem" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-brand-600 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export default function ContactForm({
  defaultName,
  defaultEmail,
  defaultTopic = "account",
  defaultMessage = "",
}: {
  defaultName: string;
  defaultEmail: string;
  defaultTopic?: string;
  defaultMessage?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [topic, setTopic] = useState(topics.some((t) => t.value === defaultTopic) ? defaultTopic : "account");
  const [message, setMessage] = useState(defaultMessage);
  const [website, setWebsite] = useState(""); // hidden field for bots
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "contact",
          name,
          email,
          topic,
          message,
          website,
          page: "/contact",
        }),
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

  if (sent) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-xl font-extrabold text-emerald-900">Message sent ✅</p>
        <p className="mt-2 text-emerald-900">
          Thank you. We&apos;ll reply to <span className="font-semibold">{email}</span> as soon as we can.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Your name</label>
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Your email</label>
        <input
          required
          type="email"
          maxLength={200}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">We&apos;ll reply to this email address.</p>
      </div>

      <div>
        <label className={labelClass}>What is this about?</label>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass}>
          {topics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Message</label>
        <textarea
          required
          rows={6}
          minLength={10}
          maxLength={2000}
          placeholder="Tell us what's going on..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-right text-xs text-slate-500">{message.length}/2000</p>
      </div>

      {/* Bots fill this in. People never see it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}