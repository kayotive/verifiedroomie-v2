"use client";

import { useState } from "react";
import Link from "next/link";
import { LOCATIONS } from "@/lib/locations";

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400";
const label = "mb-1.5 block text-xs font-medium text-slate-500";

/**
 * Location (city or town, then area) + gender + apartment type, in one form.
 * It is a normal GET form, so every choice lives in the address.
 * mode "feed"   = a seeker looking at listings
 * mode "people" = an owner looking at seekers (type = what the seeker is open to)
 */
export default function SearchFilters({
  mode,
  action,
  state,
  area,
  gender,
  type,
  sort,
}: {
  mode: "feed" | "people";
  action: string;
  state: string;
  area: string;
  gender: string;
  type: string;
  sort: string;
}) {
  const [st, setSt] = useState(state);
  const loc = LOCATIONS.find((l) => l.state === st);
  const active = [state, area, gender, type].filter(Boolean).length;

  return (
    <form
      method="get"
      action={action}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
    >
      {sort && sort !== "recent" && <input type="hidden" name="sort" value={sort} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-3">
          <label htmlFor="sf-state" className={label}>
            City or town
          </label>
          <select
            id="sf-state"
            name="state"
            value={st}
            onChange={(e) => setSt(e.target.value)}
            className={field}
          >
            <option value="">All cities and towns</option>
            {LOCATIONS.map((l) => (
              <option key={l.state} value={l.state}>
                {l.state}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="sf-area" className={label}>
            Area
          </label>
          <select
            key={st}
            id="sf-area"
            name="area"
            defaultValue={st === state ? area : ""}
            disabled={!loc}
            className={field}
          >
            <option value="">{loc ? `Anywhere in ${loc.state}` : "Pick a city or town first"}</option>
            {loc?.areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="sf-gender" className={label}>
            Gender
          </label>
          <select id="sf-gender" name="gender" defaultValue={gender} className={field}>
            <option value="">Any gender</option>
            {mode === "feed" ? (
              <>
                <optgroup label="Rooms accepting">
                  <option value="pref_male">Accepting male roomies</option>
                  <option value="pref_female">Accepting female roomies</option>
                </optgroup>
                <optgroup label="Host is">
                  <option value="is_male">Host is male</option>
                  <option value="is_female">Host is female</option>
                </optgroup>
              </>
            ) : (
              <>
                <optgroup label="Seeker is">
                  <option value="is_male">Seeker is male</option>
                  <option value="is_female">Seeker is female</option>
                </optgroup>
                <optgroup label="Seeker wants a housemate who is">
                  <option value="pref_male">Wants a male housemate</option>
                  <option value="pref_female">Wants a female housemate</option>
                </optgroup>
              </>
            )}
          </select>
        </div>

        {(
          <div className="lg:col-span-2">
            <label htmlFor="sf-type" className={label}>
              Apartment type
            </label>
            <select id="sf-type" name="type" defaultValue={type} className={field}>
              <option value="">Any type</option>
              <option value="self_contained">Self-contained</option>
              <option value="1_bedroom">1 Bedroom</option>
              <option value="2_bedroom">2 Bedroom</option>
              <option value="3_bedroom">3 Bedroom</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Search
          </button>
          {active > 0 && (
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