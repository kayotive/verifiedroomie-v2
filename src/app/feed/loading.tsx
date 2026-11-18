import { SkeletonGrid } from "@/components/ui";

export default function Loading() {
  return (
    <main>
      <section className="border-b border-slate-100 bg-linear-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-24 animate-pulse rounded-3xl bg-white shadow-card ring-1 ring-slate-200 lg:h-[88px]" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-5 h-5 w-44 animate-pulse rounded bg-slate-200" />
        <SkeletonGrid count={8} />
      </section>
    </main>
  );
}
