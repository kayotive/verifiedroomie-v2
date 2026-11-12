import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-6 text-center">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to VerifiedRoomie
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Find Your Room. Find Your People. Feel at Home.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-xl border border-emerald-600 px-6 py-3 font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Create Account
        </Link>
      </div>
    </main>
  );
}