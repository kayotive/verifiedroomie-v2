// Shown right after a click while the next page is loading, so the site never feels frozen.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading">
      <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-brand-100">
        <div className="h-full w-1/3 animate-pulse rounded-r-full bg-brand-600" />
      </div>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      </main>
    </div>
  );
}