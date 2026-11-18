import Link from "next/link";
import { SearchIcon } from "./icons";

export type FilterValues = {
  q?: string;
  type?: string;
  minBudget?: string;
  maxBudget?: string;
  gender?: string;
  religion?: string;
  smoking?: string;
  minAge?: string;
  maxAge?: string;
  sort?: string;
};

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
const label = "mb-1.5 block text-xs font-medium text-slate-500";

/**
 * One wide set of search and filters across the top of a discovery page.
 * It is a normal GET form, so the page reads the choices from the address.
 * Names: q, type, minBudget, maxBudget, gender, religion, smoking, minAge, maxAge, sort.
 */
export default function FilterBar({
  action,
  showHousing = false,
  searchPlaceholder = "",
  submitLabel = "Search",
  values,
}: {
  action: string;
  showHousing?: boolean;
  searchPlaceholder?: string;
  submitLabel?: string;
  values: FilterValues;
}) {
  const active = [
    values.q,
    values.type,
    values.minBudget,
    values.maxBudget,
    values.gender,
    values.religion,
    values.smoking,
    values.minAge,
    values.maxAge,
  ].filter(Boolean).length;

  return (
    <form
      method="get"
      action={action}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5"
    >
      {values.sort && values.sort !== "recent" && (
        <input type="hidden" name="sort" value={values.sort} />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        {showHousing && (
          <>
            <div className="sm:col-span-2 lg:col-span-5">
              <label htmlFor="f-q" className={label}>
                Where do you want to live?
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="f-q"
                  name="q"
                  defaultValue={values.q}
                  placeholder={searchPlaceholder}
                  className={field}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label htmlFor="f-type" className={label}>
                Accommodation
              </label>
              <select id="f-type" name="type" defaultValue={values.type ?? ""} className={field}>
                <option value="">Any type</option>
                <option value="self_contained">Self-contained</option>
                <option value="1_bedroom">1 Bedroom</option>
                <option value="2_bedroom">2 Bedroom</option>
                <option value="3_bedroom">3 Bedroom</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="lg:col-span-4">
              <span className={label}>Budget (₦ per year)</span>
              <div className="flex gap-2">
                <input
                  name="minBudget"
                  type="number"
                  min={0}
                  step={10000}
                  defaultValue={values.minBudget}
                  placeholder="Min"
                  aria-label="Minimum budget"
                  className={field}
                />
                <input
                  name="maxBudget"
                  type="number"
                  min={0}
                  step={10000}
                  defaultValue={values.maxBudget}
                  placeholder="Max"
                  aria-label="Maximum budget"
                  className={field}
                />
              </div>
            </div>
          </>
        )}

        <div className="lg:col-span-2">
          <label htmlFor="f-gender" className={label}>
            Gender
          </label>
          <select id="f-gender" name="gender" defaultValue={values.gender ?? ""} className={field}>
            <option value="">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="f-religion" className={label}>
            Religion
          </label>
          <select id="f-religion" name="religion" defaultValue={values.religion ?? ""} className={field}>
            <option value="">Any</option>
            <option value="Christian">Christian</option>
            <option value="Muslim">Muslim</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="f-smoking" className={label}>
            Smoking
          </label>
          <select id="f-smoking" name="smoking" defaultValue={values.smoking ?? ""} className={field}>
            <option value="">Any</option>
            <option value="non_smoker">Non-smoker</option>
            <option value="smoker">Smoker</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <span className={label}>Age range</span>
          <div className="flex gap-2">
            <input
              name="minAge"
              type="number"
              min={18}
              max={99}
              defaultValue={values.minAge}
              placeholder="From"
              aria-label="Minimum age"
              className={field}
            />
            <input
              name="maxAge"
              type="number"
              min={18}
              max={99}
              defaultValue={values.maxAge}
              placeholder="To"
              aria-label="Maximum age"
              className={field}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 hover:shadow-md"
          >
            {submitLabel}
          </button>
          {active > 0 && (
            <Link
              href={action}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear ({active})
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
