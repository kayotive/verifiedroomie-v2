"use client";

import { LOCATIONS, stateLabel } from "@/lib/locations";

/** State drop-down, then an area drop-down for that state. Used by seekers. */
export default function LocationSelect({
  state,
  area,
  onChange,
  inputClass,
  labelClass,
}: {
  state: string;
  area: string;
  onChange: (state: string, area: string) => void;
  inputClass: string;
  labelClass: string;
}) {
  const loc = LOCATIONS.find((l) => l.state === state);

  return (
    <>
      <div>
        <label className={labelClass}>Where are you looking? (City or town)</label>
        <select
          required
          value={state}
          onChange={(e) => onChange(e.target.value, "")}
          className={inputClass}
        >
          <option value="">Select the city or town...</option>
          {LOCATIONS.map((l) => (
            <option key={l.state} value={l.state}>
              {stateLabel(l)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Area</label>
        <select
          disabled={!loc}
          value={loc?.areas.includes(area) ? area : ""}
          onChange={(e) => onChange(state, e.target.value)}
          className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`}
        >
          <option value="">
            {loc ? `Anywhere in ${stateLabel(loc)}` : "Choose a city or town first"}
          </option>
          {loc?.areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Owners can find you by searching this place. You can change it any time in your profile.
        </p>
      </div>
    </>
  );
}