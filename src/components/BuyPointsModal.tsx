"use client";

import { useEffect, useState } from "react";
import { PLANS, perConnection, type Plan } from "@/lib/plans";

export default function BuyPointsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [chosen, setChosen] = useState<Plan | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function close() {
    setChosen(null);
    onClose();
  }

  // Payments are not active yet. When Paystack is connected, start the checkout here
  // and credit the points only after Paystack confirms the payment.
  function choose(plan: Plan) {
    setChosen(plan);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Get Connect Points"
      onClick={close}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-500 transition hover:bg-slate-100"
        >
          ✕
        </button>

        <p className="text-sm font-semibold text-brand-700">Connect Points</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          You&apos;re out of Connect Points
        </h2>
        <p className="mt-2 text-slate-600">
          Each connection uses 1 point. Pick a package to keep connecting. Browsing is always free,
          and your credits never expire.
        </p>

        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
          Payments aren&apos;t active yet, so no money can be charged. You can preview the packages
          below.
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-4 ${
                plan.popular ? "border-brand-600 ring-2 ring-brand-100" : "border-slate-200"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-4 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white">
                  Most popular
                </span>
              )}
              <p className="font-bold text-slate-900">{plan.name}</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                ₦{plan.price.toLocaleString("en-NG")}
              </p>
              <p className="text-sm font-semibold text-brand-700">
                {plan.connections} connections
              </p>
              <p className="mt-1 text-xs text-slate-500">
                About ₦{perConnection(plan).toLocaleString("en-NG")} each
              </p>
              <p className="mt-3 flex-1 text-sm text-slate-600">{plan.blurb}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                <li>✓ Phone number shared once accepted</li>
                <li>✓ Credits never expire</li>
              </ul>
              <button
                type="button"
                onClick={() => choose(plan)}
                className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  plan.popular
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "border border-slate-200 text-slate-800 hover:bg-slate-50"
                }`}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>

        {chosen && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You chose <span className="font-semibold">{chosen.name}</span> (
            {chosen.connections} connections for ₦{chosen.price.toLocaleString("en-NG")}). Online
            payment is coming soon. Once it&apos;s live, your points will be added to your account
            automatically after you pay.
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={close}
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}