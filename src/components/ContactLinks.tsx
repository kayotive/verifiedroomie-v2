// Contact links with icons. Used in the footer of the home page.
import Link from "next/link";

const EMAIL = "askverifiedroomie@gmail.com";
const WHATSAPP_NUMBER = "2349077383439"; // +234 907 738 3439
const HANDLE = "officialverifiedroomie";

type IconProps = { children: React.ReactNode };

function Icon({ children }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const linkClass =
  "inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-brand-600";

export default function ContactLinks({ showFormLink = true }: { showFormLink?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-900">Need help? Contact us</p>
      <ul className="flex flex-col gap-2">
        <li>
          <a href={`mailto:${EMAIL}`} className={linkClass}>
            <Icon>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6l9 -6" />
            </Icon>
            {EMAIL}
          </a>
        </li>
        <li>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <Icon>
              <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
              <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
            </Icon>
            WhatsApp: +234 907 738 3439
          </a>
        </li>
        <li>
          <a
            href={`https://www.instagram.com/${HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <Icon>
              <rect x="4" y="4" width="16" height="16" rx="4" />
              <circle cx="12" cy="12" r="3" />
              <path d="M16.5 7.5v.01" />
            </Icon>
            Instagram: @{HANDLE}
          </a>
        </li>
        <li>
          <a
            href={`https://www.tiktok.com/@${HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <Icon>
              <path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />
            </Icon>
            TikTok: @{HANDLE}
          </a>
        </li>
      </ul>
      {showFormLink && (
        <Link
          href="/contact"
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Icon>
            <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1H9l-5 4V6a1 1 0 0 1 1 -1z" />
          </Icon>
          Send us a message
        </Link>
      )}
    </div>
  );
}