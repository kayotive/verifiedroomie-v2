"use client";

import { TYPE_OPTIONS } from "@/lib/apartmentTypes";

/**
 * Optional multi-choice: tap to select or unselect.
 * Nothing selected means "any type".
 */
export default function TypePicker({
  value,
  onChange,
  labelClass,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  labelClass: string;
}) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <div>
      <span className={labelClass}>
        Apartment type you are looking for <span className="font-normal text-gray-500">(optional)</span>
      </span>
      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              aria-pressed={on}
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                on
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-gray-300 text-gray-700 hover:border-emerald-300"
              }`}
            >
              {on ? "✓ " : ""}
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {value.length === 0 ? "Any type. Owners will see you whatever their apartment is." : "Tap again to remove."}
      </p>
    </div>
  );
}