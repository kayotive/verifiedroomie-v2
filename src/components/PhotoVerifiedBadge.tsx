// Small "Photo verified" caption shown under a profile photo that our team has approved.
export default function PhotoVerifiedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-green-200">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-3 w-3"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      Photo verified
    </span>
  );
}