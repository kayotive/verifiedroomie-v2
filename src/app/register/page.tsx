"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

function isAdult(dob: string) {
  const birth = new Date(dob);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return birth <= cutoff;
}

export default function RegisterPage() {
  const supabase = createClient();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    religion: "",
    smoking: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function update(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isAdult(form.dateOfBirth)) {
      setError("You must be at least 18 years old to register.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          full_name: form.fullName,
          phone: form.phone,
          date_of_birth: form.dateOfBirth,
          gender: form.gender,
          occupation: form.occupation,
          religion: form.religion,
          smoking: form.smoking,
        },
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (data.user && data.user.identities?.length === 0) {
      setError("An account with this email already exists. Please log in.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Check your email</h1>
        <p className="max-w-sm text-gray-600">
          We sent a verification link to <strong>{form.email}</strong>. Click
          it to activate your account, then log in.
        </p>
        <Link href="/login" className="font-semibold text-emerald-700">
          Go to Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
      <p className="mb-6 mt-1 text-gray-600">
        Find Your Room. Find Your People. Feel at Home.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Full Name</label>
          <input name="fullName" required value={form.fullName} onChange={update} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Email Address</label>
          <input name="email" type="email" required value={form.email} onChange={update} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Phone Number</label>
          <input name="phone" type="tel" required placeholder="08012345678" value={form.phone} onChange={update} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <input name="password" type="password" required minLength={8} value={form.password} onChange={update} className={inputClass} />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
        </div>

        <div>
          <label className={labelClass}>Date of Birth</label>
          <input name="dateOfBirth" type="date" required value={form.dateOfBirth} onChange={update} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Gender</label>
          <select name="gender" required value={form.gender} onChange={update} className={inputClass}>
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Occupation</label>
          <select name="occupation" required value={form.occupation} onChange={update} className={inputClass}>
            <option value="">Select...</option>
            <option value="student">Student</option>
            <option value="nysc_corper">NYSC Corper</option>
            <option value="professional">Professional</option>
            <option value="other">Others</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Religion (optional)</label>
          <select name="religion" value={form.religion} onChange={update} className={inputClass}>
            <option value="">Prefer not to say</option>
            <option value="Christian">Christian</option>
            <option value="Muslim">Muslim</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Smoking Preference</label>
          <select name="smoking" required value={form.smoking} onChange={update} className={inputClass}>
            <option value="">Select...</option>
            <option value="non_smoker">Non-smoker</option>
            <option value="smoker">Smoker</option>
          </select>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-700">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}