import Image from "next/image";
import Link from "next/link";

export default function Logo({
  href = "/",
  onClick,
}: {
  href?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="VerifiedRoomie home"
      className="inline-flex items-center gap-2.5"
    >
      <Image
        src="/logo-mark.png"
        alt=""
        width={40}
        height={36}
        priority
        className="h-9 w-auto"
      />
      <span className="text-xl font-extrabold tracking-tight text-slate-700">
        Verified<span className="text-brand-600">Roomie</span>
      </span>
    </Link>
  );
}