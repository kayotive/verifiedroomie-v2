import type { ComponentType, ReactNode, SVGProps } from "react";
import Link from "next/link";

/** Round profile photo, or a brand-blue initial when there is no photo. */
export function Avatar({
  src,
  name,
  size = 48,
  className = "",
}: {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `${name}'s photo` : ""}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      style={{ ...style, fontSize: size * 0.4 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 ${className}`}
    >
      {initial}
    </span>
  );
}

const pillTones = {
  slate: "bg-slate-100 text-slate-700",
  brand: "bg-brand-50 text-brand-700",
  solid: "bg-brand-600 text-white",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
} as const;

export function Pill({
  children,
  tone = "slate",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof pillTones;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pillTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Friendly message shown when a list is empty. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
      {children && <p className="mt-1.5 max-w-md text-slate-600">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Pulsing placeholder cards shown while a page loads. */
export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-200" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  return "over a year ago";
}

export function isNew(iso: string, days = 7) {
  return Date.now() - new Date(iso).getTime() < days * 24 * 60 * 60 * 1000;
}

/**
 * Describes how recently someone was active, using the real "last active" time.
 * Returns null when there is no timestamp or it is older than a week,
 * so we never show anything misleading.
 */
export function activity(iso: string | null | undefined) {
  if (!iso) return null;
  const hours = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (hours < 1) return { label: "Active in the last hour", recent: true };
  if (hours < 24) return { label: "Active today", recent: true };
  if (hours < 24 * 7) return { label: "Active this week", recent: false };
  return null;
}

/** Sort choices shown as a small switch above the results. */
export function SortTabs({
  options,
  current,
  hrefFor,
}: {
  options: { value: string; label: string }[];
  current: string;
  hrefFor: (value: string) => string;
}) {
  return (
    <nav
      aria-label="Sort results"
      className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-semibold"
    >
      {options.map((o) => (
        <Link
          key={o.value}
          href={hrefFor(o.value)}
          aria-current={current === o.value ? "true" : undefined}
          className={`rounded-lg px-3.5 py-1.5 transition ${
            current === o.value
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
