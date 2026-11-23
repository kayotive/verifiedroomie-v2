"use client";

import { useState } from "react";
import Link from "next/link";
import { LOCATIONS, stateLabel } from "@/lib/locations";

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
const label = "mb-1.5 block text-xs font-medium text-slate-500";

/**
 * Search by state first, then (optionally) an area in that state.
 * It is a normal GET form, so the page reads "state" and "area" from the address.
 */
export default function LocationFilter({
  action,
  state,
  area,
  sort,
}: {
  action: string;
  state: string;
  area: string;
  sort?: string;
}) {
  const [stateValue, setStateValue] = useState(state);
  const [areaValue, setAreaValue] = useState(area);
  const loc = LOCATIONS.find((l) => l.state === stateValue);

  return (
    <form
      method="get"
      action={action}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
    >
      {sort && sort !== "recent" && <input type="hidden" name="sort" value={sort} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-4">
          <label htmlFor="f-state" className={label}>
            State
          </label>
          <select
            id="f-state"
            name="state"
            value={stateValue}
            onChange={(e) => {
              setStateValue(e.target.value);
              setAreaValue("");
            }}
            className={field}
          >
            <option value="">Select a state</option>
            {LOCATIONS.map((l) => (
              <option key={l.state} value={l.state}>
                {stateLabel(l)}
              </option>
            ))}
          </select>
        </div>

        {loc && (
          <div className="lg:col-span-4">
            <label htmlFor="f-area" className={label}>
              Area
            </label>
            <select
              id="f-area"
              name="area"
              value={areaValue}
              onChange={(e) => setAreaValue(e.target.value)}
              className={field}
            >
              <option value="">All areas</option>
              {loc.areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={!stateValue}
            className="flex-1 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
          {state && (
            <Link
              href={action}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}